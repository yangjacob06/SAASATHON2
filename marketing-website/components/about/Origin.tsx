/**
 * Why the company exists — two paragraphs and a ruled pair of positions.
 *
 * Kept short deliberately. The honest version of this story is that four
 * people saw software catching up with an industry that had not, and
 * started building; anything longer than that would be invention, and the
 * page is better for refusing to pad it.
 */

const POSITIONS = [
  {
    label: "What we think is outdated",
    body: "Deal preparation is still manual work done from scratch, deal by deal, in documents and inboxes that were never designed to hold it.",
  },
  {
    label: "What we think changes it",
    body: "Software that reads the file, understands the shape of the deal and keeps the state of it — so an adviser spends their attention on judgement rather than on assembly.",
  },
];

export function Origin() {
  return (
    <section className="section stratum-2 border-t border-rule">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <p data-reveal="fade" className="tech lg:sticky lg:top-28">
            <span className="tech-accent">01</span> — Why
          </p>
        </div>

        <div className="lg:col-span-9">
          <h2 data-reveal className="headline max-w-3xl text-(length:--text-h2) leading-[1.12] text-graphite">
            We started this because the gap between what software can now do and how this work is
            actually done got too large to ignore.
          </h2>

          <div className="mt-12 grid gap-10 border-t border-rule pt-10 sm:grid-cols-2">
            {POSITIONS.map((p, i) => (
              <div
                key={p.label}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <p className="tech">{p.label}</p>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-grey">{p.body}</p>
              </div>
            ))}
          </div>

          <p
            data-reveal
            style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
            className="mt-12 max-w-xl text-[15.5px] leading-relaxed text-grey-light"
          >
            We are young and we are early. We would rather be judged on the product than on a
            story about ourselves, which is why this page is mostly names and one idea.
          </p>
        </div>
      </div>
    </section>
  );
}
