import { FounderPortrait } from "@/components/about/FounderPortrait";
import { FOUNDERS } from "@/lib/founders";

/**
 * The four founders, as a ruled index rather than four cards.
 *
 * Every founder gets an identical row — same rule, same numeral, same type
 * size, same frame — because no one of them outranks the others and the
 * layout should say so before the copy does. The name is the graphic
 * element; everything else is quiet beside it.
 *
 * Desktop rows open on hover: the portrait scales up out of its frame and
 * the name shifts to the accent. Mobile has no hover, so rows are simply
 * open — not a degraded version of the desktop behaviour but the same
 * information without the reveal.
 */
export function FounderIndex() {
  return (
    <section id="founders" className="section stratum-1 border-t border-rule">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <p data-reveal="fade" className="tech lg:col-span-3">
            <span className="tech-accent">02</span> — The four
          </p>
          <h2
            data-reveal
            className="headline max-w-2xl text-(length:--text-h3) leading-snug text-graphite lg:col-span-9"
          >
            Four founders, one company, and no layer between the people who decided what to build
            and the people building it.
          </h2>
        </div>

        <ol className="mt-16 sm:mt-20">
          {FOUNDERS.map((founder, i) => (
            <li
              key={founder.id}
              id={founder.id}
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              className="group scroll-mt-28 border-t border-rule last:border-b"
            >
              <div className="grid items-center gap-x-10 gap-y-6 py-8 sm:py-10 lg:grid-cols-12">
                {/* ── Index ─────────────────────────────────────────── */}
                <span className="tech lg:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* ── Name ──────────────────────────────────────────── */}
                <h3 className="lg:col-span-4">
                  <span className="display block text-[clamp(2.5rem,1.4rem+3.6vw,4.5rem)] text-graphite transition-colors duration-500 ease-[var(--ease-out-expo)] group-hover:text-signal">
                    {founder.name}
                  </span>
                  <span className="tech mt-2 block">{founder.role}</span>
                </h3>

                {/* ── Contribution ──────────────────────────────────── */}
                <div className="lg:col-span-4">
                  <p className="max-w-sm text-[15px] leading-relaxed text-grey">
                    {founder.contribution}
                  </p>
                  {founder.focus.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                      {founder.focus.map((f) => (
                        <li key={f} className="tech !tracking-[0.12em]">
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── Portrait ──────────────────────────────────────── */}
                {/*
                  An explicit width, not `ml-auto` + `max-w`: an auto margin
                  on a grid item drops it out of stretch, and a shrink-to-fit
                  box wrapping a `w-full` child resolves to zero.
                */}
                <div className="w-[13rem] max-w-full lg:col-span-3 lg:w-[11rem] lg:justify-self-end">
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                      <FounderPortrait founder={founder} index={i} />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p data-reveal="fade" className="tech mt-8 !normal-case !tracking-normal text-grey-light">
          Portraits to come.
        </p>
      </div>
    </section>
  );
}
