import { SplitText } from "@/components/brand/SplitText";

/**
 * The brand statement.
 *
 * One sentence, given a whole screen. The page has just spent a viewport
 * proving it can do something technically; this is where it says something,
 * and the restraint is the point — nothing moves here except the words
 * arriving.
 *
 * The hairline column of numerals down the left is the same instrument
 * register as the hero index, carried through so it reads as a system
 * rather than as a one-off flourish.
 */
export function BrandStatement() {
  return (
    <section className="section stratum-2 relative border-t border-rule">
      <div className="shell grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p data-reveal="fade" className="tech">
            <span className="tech-accent">02</span> — The premise
          </p>
        </div>

        <div className="lg:col-span-9">
          {/*
            The colour carries the sentence: setup in grey, subject in bone,
            and the accent saved for the half that is actually the problem.
          */}
          <h2 className="headline text-(length:--text-h2) leading-[1.12]" data-reveal="fade">
            <span className="block text-grey">
              <SplitText text="An industry that moves" />
            </span>
            <span className="block text-graphite">
              <SplitText text="millions of dollars" delay={110} />
            </span>
            <span className="block">
              <SplitText text="still runs on email" delay={220} />
              <span className="text-signal">.</span>
            </span>
          </h2>

          <div className="mt-12 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2 lg:mt-16">
            <p
              data-reveal
              className="max-w-md text-[15.5px] leading-relaxed text-grey"
            >
              New Zealand&rsquo;s non-bank lending market has grown faster than the tooling around
              it. Advisers hold the whole picture in their heads and rebuild the same deal summary
              from scratch every time, because nothing else does it for them.
            </p>
            <p
              data-reveal
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
              className="max-w-md text-[15.5px] leading-relaxed text-grey"
            >
              That is not a small inefficiency. It is the reason good deals sit unplaced, and the
              reason an adviser&rsquo;s capacity is capped by administration rather than by
              judgement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
