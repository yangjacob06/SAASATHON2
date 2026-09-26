import Link from "next/link";

import { Magnetic } from "@/components/brand/Magnetic";
import { SplitText } from "@/components/brand/SplitText";
import { ArrowUpRight } from "@/components/ui/Icons";
import { ENTER_LABEL, SOFTWARE_URL } from "@/lib/config";

/**
 * The closing ask.
 *
 * The largest type on the page, and the only element on its screen. After
 * the preview has shown the visitor the product, the last thing the brand
 * world does is get out of the way and point.
 */
export function ClosingCta() {
  return (
    <section className="relative stratum-3 overflow-hidden border-t border-rule">
      <div className="shell flex min-h-[82vh] flex-col justify-center py-24">
        <p data-reveal="fade" className="tech">
          <span className="tech-accent">06</span> — Next
        </p>

        <h2 data-reveal="fade" className="display-xl mt-8 text-graphite">
          <span className="block">
            <SplitText text="Place the" />
          </span>
          <span className="block">
            <SplitText text="next one" start={9} />
          </span>
          <span className="block text-grey-light">
            <SplitText text="properly." start={17} />
          </span>
        </h2>

        <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-rule pt-10">
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
            Pricing, the full product and a 14-day trial are on the other side. No card to start.
          </p>
        </div>
      </div>
    </section>
  );
}
