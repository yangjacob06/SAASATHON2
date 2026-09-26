/**
 * The market, as the opening's one graphite panel.
 *
 * This section used to be a full-bleed photograph. With the photography
 * gone it does the job the photograph was really doing — breaking the run
 * of paper so the page has a floor as well as a ceiling — and it does it
 * with ink and type instead of an image. It is the twenty per cent, and it
 * only works while it stays the only one on the page.
 */

const FACTS = [
  { value: "150+", label: "New Zealand non-bank lenders and funds to navigate" },
  { value: "$2m–$30m", label: "The deal range Mandate is built around" },
  { value: "60 sec", label: "Target time to a first summary draft" },
];

export function PlaceBand() {
  return (
    <section className="panel-dark relative overflow-hidden">
      <div className="shell section-tight relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-5">
            <p data-reveal="fade" className="tech">
              <span className="tech-accent">04</span> — The market
            </p>
            <h2
              data-reveal
              className="display mt-5 text-[clamp(2rem,1.1rem+3.4vw,4.25rem)] text-paper"
            >
              Built here, for the way lending actually works here
              <span className="text-signal">.</span>
            </h2>
            <p
              data-reveal
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
              className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/70"
            >
              Mandate is made in Christchurch for New Zealand commercial finance advisers — a
              market small enough that the relationships matter and complex enough that nobody can
              hold all of it in their head.
            </p>
          </div>

          <dl className="grid gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
            {FACTS.map((f, i) => (
              <div
                key={f.value}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="border-t border-paper/20 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="whitespace-nowrap font-display text-[clamp(1.9rem,1.35rem+1.5vw,2.5rem)] leading-none text-paper">
                  {f.value}
                </dt>
                <dd className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-paper/60">
                  {f.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative mt-14 max-w-2xl text-[11.5px] leading-relaxed text-paper/45">
          Illustrative figures for product demonstration. Lender appetite, processing time and deal
          ranges vary.
        </p>
      </div>
    </section>
  );
}
