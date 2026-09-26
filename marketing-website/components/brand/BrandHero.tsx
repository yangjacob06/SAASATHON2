import Link from "next/link";

import { LatticeField } from "@/components/brand/LatticeField";
import { Magnetic } from "@/components/brand/Magnetic";
import { SplitText } from "@/components/brand/SplitText";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icons";
import { ENTER_LABEL, SOFTWARE_URL, softwareAnchor } from "@/lib/config";

/**
 * The opening screen.
 *
 * A live lattice sits behind the type: a wireframe plane that resolves out
 * of warp as the page scrolls, and lifts under the cursor. It is drawn in
 * graphite on the paper ground so it reads as a drafting overlay rather
 * than as a glowing object — the technology is implied by precision, not
 * announced. Below it, a static grid carries the same texture for anything
 * that cannot run it.
 *
 * The three operations run along the foot as an index. They earn their
 * numerals: this genuinely is the order the work happens in, which is the
 * only thing that justifies numbering a list.
 */

const OPERATIONS = [
  { n: "01", label: "Prepare", href: softwareAnchor("product") },
  { n: "02", label: "Match", href: softwareAnchor("how-it-works") },
  { n: "03", label: "Track", href: softwareAnchor("pricing") },
];

export function BrandHero() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col justify-between overflow-hidden pb-10 pt-32 sm:pt-36">
      {/* ── The lattice, over a static grid that stands in for it ──── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="blueprint absolute inset-0 [mask-image:radial-gradient(75%_65%_at_50%_40%,black,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[56%]">
          <LatticeField />
        </div>
        {/* The type sits on clean paper; the drawing fades out above it. */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-paper via-paper/92 to-transparent" />
      </div>

      <div className="shell relative flex flex-1 flex-col justify-center">
        <div data-reveal="fade" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="tech tech-accent">Mandate</span>
          <span className="hidden h-px w-10 bg-rule sm:block" />
          <span className="tech">Private-credit infrastructure</span>
          <span className="hidden h-px w-10 bg-rule sm:block" />
          <span className="tech">Christchurch · NZ</span>
        </div>

        <h1 data-reveal="fade" className="display-xl mt-8 text-graphite">
          <span className="block">
            <SplitText text="Private credit," delay={140} />
          </span>
          <span className="block">
            <SplitText text="structured" delay={320} />
            <span className="text-signal">.</span>
          </span>
        </h1>

        <div className="mt-14 grid gap-10 border-t border-rule pt-8 lg:grid-cols-12 lg:items-end">
          <p
            data-reveal
            style={{ "--reveal-delay": "500ms" } as React.CSSProperties}
            className="max-w-xl text-[16px] leading-relaxed text-grey lg:col-span-6"
          >
            A commercial finance adviser&rsquo;s deal flow arrives unsorted — PDFs, phone calls and
            a memory of which fund said no last time. Mandate is the instrument that puts it in
            order.
          </p>

          <div
            data-reveal
            style={{ "--reveal-delay": "600ms" } as React.CSSProperties}
            className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:col-span-6 lg:justify-end"
          >
            <Magnetic>
              <Link
                href={SOFTWARE_URL}
                data-cursor="enter"
                data-cursor-label="Enter"
                className="group inline-flex items-center gap-3 bg-graphite px-7 py-4 text-[13.5px] font-medium text-paper transition-colors duration-300 ease-[var(--ease-out-quint)] hover:bg-signal"
              >
                {ENTER_LABEL}
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </Magnetic>

            <span className="tech inline-flex items-center gap-2.5">
              <span className="live-dot h-1 w-1 rounded-full bg-signal" />
              Scroll
            </span>
          </div>
        </div>
      </div>

      {/* ── The three operations, as a foot index ──────────────────── */}
      <div className="shell relative">
        <ul
          data-reveal="fade"
          style={{ "--reveal-delay": "700ms" } as React.CSSProperties}
          className="grid grid-cols-3 border-t border-rule"
        >
          {OPERATIONS.map((op) => (
            <li key={op.n} className="border-rule not-last:border-r">
              <Link
                href={op.href}
                data-cursor="link"
                className="group flex items-baseline gap-3 py-5 pr-4 transition-colors duration-300 sm:gap-4"
              >
                <span className="tech transition-colors duration-300 group-hover:text-signal">
                  {op.n}
                </span>
                <span className="font-display text-[clamp(1.125rem,0.9rem+0.7vw,1.5rem)] text-graphite">
                  {op.label}
                </span>
                <ArrowRight
                  size={13}
                  className="ml-auto hidden self-center text-grey-light opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:opacity-100 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
