/**
 * PDF text extraction, for feeding uploaded valuations/feasibility studies/
 * financials into the deal summary prompt. Pure-JS (via unpdf's bundled
 * pdfjs build) — no native dependency, so it works in any deploy target.
 */

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : (text as string[]).join("\n\n");
  } catch (err) {
    console.error("PDF extraction failed", err);
    return "";
  }
}
