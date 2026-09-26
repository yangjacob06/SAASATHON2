import Link from "next/link";

import { Magnetic } from "@/components/brand/Magnetic";
import { SplitText } from "@/components/brand/SplitText";
import { ArrowUpRight } from "@/components/ui/Icons";
import { ENTER_LABEL, SOFTWARE_URL } from "@/lib/config";

/**
 * The About page's exit.
 *
 * The page has spent its length on people; it closes by handing the
 * visitor back to the thing those people made, which is the only proof
 * that actually matters at this stage.
 */
export function AboutCta() {
  return (
    <section className="relative stratum-3 border-t border-rule">
      <div className="shell flex min-h-[70vh] flex-col justify-center py-24">
        <p data-reveal="fade" className="tech">
          <span className="tech-accent">04</span> — The product
        </p>

        <h2 data-reveal="fade" className="display-xl mt-8 text-graphite">
          <span className="block">
            <SplitText text="See what" />
          </span>
          <span className="block">
            <SplitText text="we built" delay={140} />
            <span className="text-signal">.</span>
          </span>
        </h2>

        <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-rule pt-10">
          <Magnetic>
            <Link
              href={SOFTWARE_URL}
              data-cursor="enter"
              data-cursor-label="Enter"
              className="group inline-flex items-center gap-3 rounded-full bg-signal px-8 py-4 text-[14px] font-medium text-paper transition-colors duration-500 ease-[var(--ease-out-expo)] hover:bg-graphite"
            >
              {ENTER_LABEL}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </Magnetic>
          <p className="max-w-xs text-[14px] leading-relaxed text-grey-light">
            Mandate is live and in a 14-day trial. Bring a deal you are working on and see what it
            does with it.
          </p>
        </div>
      </div>
    </section>
  );
}
