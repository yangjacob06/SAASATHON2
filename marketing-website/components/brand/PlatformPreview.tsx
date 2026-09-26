import Link from "next/link";

import { DealMatchPanel } from "@/components/marketing/DealMatchPanel";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Parallax } from "@/components/ui/Parallax";
import { ENTER_LABEL, SOFTWARE_URL } from "@/lib/config";

/**
 * The crossing.
 *
 * The product's own interface, lifted onto a bone panel that rises out of
 * the dark ground — the two worlds of this site in one frame, and the
 * visitor's first sight of the light side they are about to enter. The
 * panel is the same component the platform page uses, not a mock of it, so
 * the preview can never drift from the real thing.
 */
export function PlatformPreview() {
  return (
    <section className="section stratum-2 relative overflow-hidden border-t border-rule">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p data-reveal="fade" className="tech">
              <span className="tech-accent">05</span> — The platform
            </p>
            <h2
              data-reveal
              className="display mt-5 text-[clamp(2.25rem,1.2rem+3.8vw,4.75rem)] text-graphite"
            >
              Where the brand ends
              <br />
              <span>the work begins</span>
              <span className="text-signal">.</span>
            </h2>
          </div>
          <p
            data-reveal
            style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
            className="max-w-md text-[15px] leading-relaxed text-grey lg:col-span-5"
          >
            Past this point the site stops being a statement and starts being a product: what it
            does, what it costs, and how to begin. Everything you are about to see is the working
            interface.
          </p>
        </div>

        {/* The bone panel arriving in the dark world. */}
        <div
          data-reveal="scale"
          className="relative mt-14 sm:mt-20"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          <Parallax speed={0.03}>
            <div className="rounded-[var(--radius-panel)] bg-graphite p-4 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.85)] sm:p-8">
              <DealMatchPanel />
            </div>
          </Parallax>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-rule pt-8">
          <p data-reveal="fade" className="tech max-w-sm !normal-case !tracking-normal text-grey-light">
            Sample deal shown. Figures are illustrative and are not a lending offer.
          </p>
          <Link
            data-reveal="fade"
            href={SOFTWARE_URL}
            data-cursor="link"
            className="nudge group inline-flex items-center gap-3 text-[15px] font-medium text-graphite transition-colors duration-300 hover:text-signal"
          >
            <span className="rule-link">{ENTER_LABEL}</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
