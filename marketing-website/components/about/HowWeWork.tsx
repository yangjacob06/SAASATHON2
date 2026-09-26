/**
 * Four positions on how the company operates.
 *
 * Every line here is something the founders actually told us about
 * themselves — young, hands-on, building it themselves, serious — stated
 * flatly rather than dressed up. The restraint is what makes it credible:
 * a company this early has no track record to point at, so the only
 * honest claim available is how it works.
 */

const POSITIONS = [
  {
    n: "01",
    title: "We build it ourselves",
    body: "The product is written by the people who decided what it should be. No agency, no outsourced backlog, no telephone game between the idea and the implementation.",
  },
  {
    n: "02",
    title: "We are close to the work",
    body: "We talk to the advisers this is for and change the product on what they tell us, because at this size we can afford to be wrong quickly.",
  },
  {
    n: "03",
    title: "We are young, and that is the point",
    body: "None of us has spent a decade learning why this cannot be done differently. We are approaching it as it is, not as it has always been.",
  },
  {
    n: "04",
    title: "We are serious about it",
    body: "This is a real product for a real market with money moving through it. It is built to that standard, and it is held to it.",
  },
];

export function HowWeWork() {
  return (
    <section className="section stratum-2 border-t border-rule">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <p data-reveal="fade" className="tech lg:col-span-3">
            <span className="tech-accent">03</span> — How we work
          </p>
          <h2
            data-reveal
            className="headline max-w-xl text-(length:--text-h3) leading-snug text-graphite lg:col-span-9"
          >
            No track record yet. Four positions instead.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border-y border-rule bg-rule sm:mt-20 sm:grid-cols-2">
          {POSITIONS.map((p, i) => (
            <article
              key={p.n}
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              className="group bg-stratum-2 p-8 transition-colors duration-500 hover:bg-stratum-1 sm:p-10"
            >
              <span className="tech transition-colors duration-500 group-hover:text-signal">{p.n}</span>
              <h3 className="headline mt-5 text-[clamp(1.375rem,1.1rem+0.9vw,1.75rem)] text-graphite">
                {p.title}
              </h3>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-grey">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
