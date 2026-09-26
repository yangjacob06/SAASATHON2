/**
 * The three steps, as an editorial index.
 *
 * The heading sticks to the left while the steps scroll past it — the one
 * sticky moment on the page, which is what keeps it feeling like an effect
 * with a reason rather than a technique applied everywhere. Each step is a
 * ruled row with an oversized numeral, so the section reads as a contents
 * page rather than as three more cards.
 */

const STEPS = [
  {
    n: "01",
    title: "Bring the deal together",
    body: "Client, loan amount, purpose, location and security in one form. Attach the valuation, feasibility study and financials as they come in.",
    detail: "Form + documents",
  },
  {
    n: "02",
    title: "Draft the summary",
    body: "One action produces a structured, lender-ready summary and the ranked shortlist of non-bank lenders most likely to fund it — each with its reasons.",
    detail: "Summary + shortlist",
  },
  {
    n: "03",
    title: "Send, then track",
    body: "Send to your shortlist, record who is interested, and follow the application through term sheet and settlement on a single timeline.",
    detail: "Through to settlement",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section border-t border-rule bg-paper-soft">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p data-reveal="fade" className="eyebrow">
              How it works
            </p>
            <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-graphite">
              From borrower file to <span className="accent">lender shortlist.</span>
            </h2>
            <p
              data-reveal
              style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
              className="lede mt-5 max-w-sm"
            >
              Three steps, in the order an adviser already works. Nothing to migrate and nothing
              to configure before the first deal.
            </p>
          </div>
        </div>

        <ol className="lg:col-span-8">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              className="group grid gap-x-8 gap-y-3 border-t border-rule-strong py-9 sm:grid-cols-[5rem_minmax(0,1fr)] sm:py-11 last:border-b"
            >
              <span className="nums font-display text-[2rem] leading-none text-graphite/45 transition-colors duration-500 group-hover:text-graphite">
                {s.n}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="headline text-(length:--text-h3) text-graphite">{s.title}</h3>
                  <span className="eyebrow-quiet">{s.detail}</span>
                </div>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-grey">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
