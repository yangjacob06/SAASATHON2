/**
 * What the software actually does, stated plainly.
 *
 * Deliberately the least decorated block on the page: a ruled index, three
 * entries, no cards and no icons. Coming straight after the statement, the
 * drop in visual temperature is the transition from brand world to product
 * world — the page getting clearer as the visitor gets closer to the thing
 * they would actually buy.
 */

const ENTRIES = [
  {
    n: "01",
    title: "Prepare",
    lede: "One structured application, drafted for a lender",
    body: "The valuation, the feasibility study and the financials go in once. What comes out is a one-page summary in the form a credit team expects to read it.",
  },
  {
    n: "02",
    title: "Match",
    lede: "Scored against each fund's mandate",
    body: "Deal criteria are checked against a directory of New Zealand non-bank lenders — size, region, LVR, pre-sales — and every placing carries the reason it was made.",
  },
  {
    n: "03",
    title: "Track",
    lede: "From first enquiry through to settlement",
    body: "Lender conversations, documents and next steps stay attached to the application, so the state of a deal is something you can look at rather than recall.",
  },
];

export function Thesis() {
  return (
    <section id="thesis" className="section stratum-1 border-t border-rule">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12">
          <p data-reveal="fade" className="tech lg:col-span-3">
            <span className="tech-accent">03</span> — The instrument
          </p>
          <h2
            data-reveal
            className="headline max-w-2xl text-(length:--text-h3) leading-snug text-graphite lg:col-span-9"
          >
            Three operations, in the order the work already happens.
          </h2>
        </div>

        <ol className="mt-16 sm:mt-20">
          {ENTRIES.map((entry, i) => (
            <li
              key={entry.n}
              data-reveal
              style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
              className="group grid gap-x-10 gap-y-4 border-t border-rule py-10 transition-colors duration-500 last:border-b sm:py-12 lg:grid-cols-12"
            >
              <span className="tech lg:col-span-1">{entry.n}</span>
              <h3 className="display text-[clamp(2rem,1.2rem+2.4vw,3.25rem)] text-graphite transition-colors duration-500 group-hover:text-signal lg:col-span-4">
                {entry.title}
              </h3>
              <p className="text-[15px] font-medium leading-snug text-grey lg:col-span-3">
                {entry.lede}
              </p>
              <p className="max-w-md text-[14.5px] leading-relaxed text-grey-light lg:col-span-4">
                {entry.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
