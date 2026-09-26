/**
 * Renders a deal summary to a downloadable PDF. Pro plan facilities can
 * include the adviser's firm logo in the header.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Block {
  text: string;
  size: number;
  bold: boolean;
  gapBefore: number;
  bullet?: boolean;
}

/** Very small Markdown-ish parser: `## `, `**bold line:**`, `- bullet`. */
function toBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      blocks.push({ text: line.slice(3), size: 16, bold: true, gapBefore: 18 });
    } else if (line.startsWith("- ")) {
      blocks.push({ text: line.slice(2), size: 10.5, bold: false, gapBefore: 4, bullet: true });
    } else if (line.startsWith("**") && line.includes(":**")) {
      const idx = line.indexOf(":**");
      const label = line.slice(2, idx);
      const rest = line.slice(idx + 3).trim();
      blocks.push({ text: `${label}: ${rest}`, size: 11, bold: false, gapBefore: 10 });
    } else if (line.startsWith("*") && line.endsWith("*")) {
      blocks.push({ text: line.slice(1, -1), size: 9, bold: false, gapBefore: 12 });
    } else {
      blocks.push({ text: line, size: 11, bold: false, gapBefore: 6 });
    }
  }
  return blocks;
}

export async function renderSummaryPdf(params: {
  markdown: string;
  firmName: string;
  clientName: string;
  logoPngBytes?: Buffer | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.06, 0.05);
  const muted = rgb(0.45, 0.43, 0.4);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  let logoImage = null;
  if (params.logoPngBytes) {
    try {
      logoImage = await doc.embedPng(params.logoPngBytes);
    } catch {
      logoImage = null;
    }
  }

  if (logoImage) {
    const dims = logoImage.scale(28 / logoImage.height);
    page.drawImage(logoImage, { x: MARGIN, y: y - 28, width: dims.width, height: 28 });
    page.drawText(params.firmName, { x: MARGIN + dims.width + 10, y: y - 20, size: 11, font: bold, color: ink });
  } else {
    page.drawText(params.firmName, { x: MARGIN, y: y - 12, font: bold, size: 12, color: ink });
  }
  page.drawText("Prepared with Mandate — private-credit deal preparation for NZ advisers", {
    x: MARGIN,
    y: y - 30,
    size: 8,
    font,
    color: muted,
  });
  y -= 56;

  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  for (const block of toBlocks(params.markdown)) {
    y -= block.gapBefore;
    const useFont = block.bold ? bold : font;
    const indent = block.bullet ? 14 : 0;
    const lines = wrapText(block.bullet ? `•  ${block.text}` : block.text, useFont, block.size, maxWidth - indent);

    for (const line of lines) {
      if (y < MARGIN + 20) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(line, { x: MARGIN + indent, y, size: block.size, font: useFont, color: ink });
      y -= block.size + 4;
    }
  }

  return doc.save();
}
