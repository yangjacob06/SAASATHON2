import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:/Users/olive/OneDrive/Desktop/SaaSathon2_project";
const skillDir = "C:/Users/olive/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const tmpDir = path.join(workspaceDir, ".codex-build", "mandate-pitch");
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
const outputPath = path.join(workspaceDir, "artifacts", "Mandate Pitch Deck.pptx");
await fs.mkdir(tmpDir, { recursive: true });
await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const runtimeUtils = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const C = { paper: "#F3F2EE", ink: "#111210", muted: "#777873", blue: "#5B7CFF", pale: "#E9EDFF", line: "#D7D6D0", white: "#FFFFFF" };
const serif = "Georgia";
const sans = "Arial";
const root = path.join(workspaceDir, "MODEL/prototype/assets/brand");
const logoSvg = await fs.readFile(path.join(root, "mandate-lockup.svg"));
const connectionSvg = await fs.readFile(path.join(root, "connections.svg"));
const logoPng = await sharp(logoSvg).png().toBuffer();
const connectionPng = await sharp(connectionSvg).resize(700, 600, { fit: "contain" }).png().toBuffer();

function rect(slide, name, left, top, width, height, fill, radius = 0) {
  return slide.shapes.add({
    name,
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: { fill: "none", width: 0 },
    ...(radius ? { borderRadius: radius } : {}),
  });
}
function text(slide, name, value, x, y, w, h, size, color = C.ink, options = {}) {
  const shape = slide.shapes.add({
    name,
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: options.serif ? serif : sans,
    fontSize: size,
    color,
    bold: !!options.bold,
    alignment: options.align || "left",
    verticalAlignment: options.valign || "middle",
    autoFit: "shrinkText",
    wrap: true,
  };
  return shape;
}
function logo(slide, x, y, width = 195) {
  slide.images.add({ blob: new Uint8Array(logoPng), contentType: "image/png", alt: "Mandate logo", fit: "contain", position: { left: x, top: y, width, height: width * 0.224 } });
}
function nodes(slide, x, y, width, height) {
  slide.images.add({ blob: new Uint8Array(connectionPng), contentType: "image/png", alt: "Mandate connected line illustration", fit: "contain", position: { left: x, top: y, width, height } });
}

// 1 — Open with the product name and leave space for the spoken hook.
{
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  logo(slide, 76, 48, 205);
  nodes(slide, 792, 112, 420, 445);
  text(slide, "title", "Mandate", 72, 190, 730, 130, 92, C.ink, { serif: true });
  text(slide, "direction", "The right connection.", 80, 332, 680, 53, 35, C.blue, { serif: true });
  text(slide, "hook", "A clearer path from business information to lender conversations.", 80, 410, 595, 100, 28, C.ink, { serif: true });
  text(slide, "footer", "PRIVATE CREDIT, MADE CLEARER FOR ADVISERS", 80, 630, 700, 26, 13, C.muted, { bold: true });
  slide.speakerNotes.textFrame.setText("Opening hook: Advisers often start with information spread across accounts, deal notes and lender criteria. Mandate brings those pieces together so the funding story is easier to review and explain. Then introduce the live demo.");
}

// 2 — A sourced New Zealand market context and the handoff to the live demo.
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  logo(slide, 70, 40, 168);
  text(slide, "title", "Why now: private credit", 70, 112, 880, 68, 47, C.ink, { serif: true });
  text(slide, "subtitle", "New Zealand businesses face changing funding options.", 72, 183, 855, 34, 20, C.muted);
  text(slide, "period", "2023–24", 76, 272, 340, 76, 53, C.blue, { serif: true });
  text(slide, "fact-one", "SME lending declined, while shorter, smaller-scale finance became more common.", 78, 350, 455, 112, 23, C.ink, { serif: true });
  text(slide, "fact-one-source", "OECD Economic Surveys: New Zealand 2026", 78, 475, 470, 24, 12, C.muted);
  text(slide, "fact-two-kicker", "A broader set of lenders", 600, 275, 475, 42, 21, C.blue, { bold: true });
  text(slide, "fact-two", "Private credit is attracting new capital and can offer tailored structures. Each fund still brings its own criteria.", 600, 322, 440, 132, 23, C.ink, { serif: true });
  nodes(slide, 1010, 250, 220, 205);
  text(slide, "takeaway", "Advisers need a clear way to compare each deal with lender requirements.", 76, 525, 820, 50, 25, C.ink, { bold: true });
  rect(slide, "demo-strip", 70, 601, 1140, 74, C.pale, 8);
  text(slide, "demo-label", "LIVE DEMO", 92, 615, 130, 20, 12, C.blue, { bold: true });
  text(slide, "demo-url", "mandate-ollie-software.vercel.app", 92, 635, 500, 25, 17, C.ink, { bold: true });
  text(slide, "handoff", "Open the site for the product walkthrough, then return here for the close.", 610, 624, 565, 32, 15, C.ink);
  slide.speakerNotes.textFrame.setText("Why now: OECD's 2026 New Zealand survey says SME lending declined sharply in 2023 and 2024 and that shorter, smaller-scale finance became more common. Chambers' 2026 New Zealand private-credit guide describes additional capital, tailored structures and a market that is still developing. The opportunity for Mandate is helping advisers review the fit and prepare a clear, checked funding story. Demo link: https://mandate-ollie-software.vercel.app/\nSources:\nOECD, OECD Economic Surveys: New Zealand 2026, https://www.oecd.org/en/publications/oecd-economic-surveys-new-zealand-2026_3ec5de98-en/full-report/unlocking-capital-markets-to-drive-growth_d1f7a7f7.html\nChambers and Partners, Private Credit 2026: New Zealand, https://practiceguides.chambers.com/practice-guides/private-credit-2026/new-zealand");
}

// 3 — Close with the requested motto and specific, practical next steps.
{
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  logo(slide, 76, 46, 190);
  text(slide, "close", "That’s how we\nMandate.", 78, 150, 760, 220, 68, C.ink, { serif: true });
  text(slide, "next-title", "Next steps", 82, 425, 260, 35, 16, C.blue, { bold: true });
  text(slide, "next-1", "01   Validate lender criteria with adviser partners", 82, 475, 720, 34, 20, C.ink);
  text(slide, "next-2", "02   Test the workflow on more deal types", 82, 525, 720, 34, 20, C.ink);
  text(slide, "next-3", "03   Refine lender-ready summaries and reports", 82, 575, 800, 34, 20, C.ink);
  nodes(slide, 866, 215, 340, 370);
  text(slide, "thanks", "Thank you", 84, 642, 280, 27, 15, C.muted, { bold: true });
  slide.speakerNotes.textFrame.setText("Close: That's how we Mandate. Invite feedback from advisers and lenders on which checks, evidence and report formats would make this most useful in practice. Suggested next steps on screen are proposed validation work, not completed commitments.");
}

const candidatePath = path.join(stagingDir, "mandate-pitch-candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
for (let i = 0; i < presentation.slides.items.length; i++) {
  const slide = presentation.slides.items[i];
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(tmpDir, `slide-${i + 1}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const montage = await presentation.export({ format: "png", montage: true, scale: 0.5 });
await fs.writeFile(path.join(tmpDir, "montage.png"), new Uint8Array(await montage.arrayBuffer()));
const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);
await finalizePresentation({
  explicitTotalSlideCount: 3,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: outputPath,
  pythonExecutable: "C:/Users/olive/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [serif, sans] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "mandate-pitch-validation.json"),
});
console.log(outputPath);
