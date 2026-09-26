/** Renders the small Markdown subset used by deal summaries: `## `, `**Label:** text`, `- bullets`, `*italic*`. */
export function SummaryMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul key={key} className="ml-5 list-disc space-y-1 text-graphite-soft">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;

    if (line.startsWith("## ")) {
      flushBullets(`b${i}`);
      nodes.push(
        <h3 key={i} className="mt-6 font-display text-xl text-graphite first:mt-0">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
    } else if (line.startsWith("**") && line.includes(":**")) {
      flushBullets(`b${i}`);
      const idx = line.indexOf(":**");
      const label = line.slice(2, idx);
      const rest = line.slice(idx + 3).trim();
      nodes.push(
        <p key={i} className="text-[15px] leading-relaxed">
          <span className="font-medium text-graphite">{label}:</span> <span className="text-graphite-soft">{rest}</span>
        </p>,
      );
    } else if (line.startsWith("*") && line.endsWith("*")) {
      flushBullets(`b${i}`);
      nodes.push(
        <p key={i} className="text-[13px] italic text-grey">
          {line.slice(1, -1)}
        </p>,
      );
    } else {
      flushBullets(`b${i}`);
      nodes.push(
        <p key={i} className="text-[15px] leading-relaxed text-graphite-soft">
          {line}
        </p>,
      );
    }
  });
  flushBullets("tail");

  return <div className="space-y-3">{nodes}</div>;
}
