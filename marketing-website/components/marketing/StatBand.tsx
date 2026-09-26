/**
 * The platform page's graphite band.
 *
 * One dark section in a light document: it separates the product story
 * from the pricing, and gives the page a floor. Every figure is explicitly
 * illustrative — none of them is a claim.
 */

const FIGURES = [
  { value: "150+", label: "NZ non-bank lenders and funds to navigate" },
  { value: "60 sec", label: "Target time to a first summary draft" },
  { value: "$2m–$30m", label: "Typical deal range Mandate is built around" },
];

export function StatBand() {
  return (
    <section className="panel-dark relative overflow-hidden">
      <div className="shell section-tight relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-5">
            <p data-reveal="fade" className="tech tech-accent">
              Built for a complex lending market
            </p>
            <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-paper">
              More signal.
              <br />
              <span className="italic">Less admin</span>
              <span className="text-signal">.</span>
            </h2>
          </div>

          <dl className="grid gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
            {FIGURES.map((f, i) => (
              <div
                key={f.value}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="border-t border-paper/20 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="nums whitespace-nowrap font-display text-[clamp(1.9rem,1.35rem+1.5vw,2.5rem)] leading-none text-paper">
                  {f.value}
                </dt>
                <dd className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-paper/70">
                  {f.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative mt-12 max-w-2xl text-[11.5px] leading-relaxed text-paper/55">
          Illustrative figures for product demonstration. Lender appetite, processing time and deal
          ranges vary.
        </p>
      </div>
    </section>
  );
}
