import Link from "next/link";

import { ArrowUpRight } from "@/components/ui/Icons";

/**
 * The closing ask.
 *
 * Deep forest, full width, and split rather than centred — a centred block
 * of text with a button under it is the default every landing page reaches
 * for. Putting the action on its own side of the band gives the eye one
 * place to land after the headline.
 */
export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-graphite text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(216_233_180/0.12),transparent_62%)]"
      />
      <div className="shell section-tight relative grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p data-reveal="fade" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">
            A clearer way to move a deal forward
          </p>
          <h2 data-reveal className="headline mt-4 text-(length:--text-h2)">
            Make your next deal
            <br />
            <span className="italic">easier to place</span>
            <span className="text-signal">.</span>
          </h2>
          <p
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-paper/80"
          >
            Join Mandate for free, bring a deal you are already working on, and see the summary and
            lender shortlist it produces. A fee applies only if a facility settles.
          </p>
        </div>

        <div
          data-reveal
          style={{ "--reveal-delay": "140ms" } as React.CSSProperties}
          className="flex flex-col items-start gap-4 lg:col-span-5 lg:items-end"
        >
          <Link
            href="/signup"
            className="nudge inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-signal px-7 py-4 text-[14px] font-medium text-graphite transition-[background-color,transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px hover:bg-[#e6f2cc]"
          >
            Create a free account
            <ArrowUpRight />
          </Link>
          <p className="text-[13px] text-paper/70">Free to use · No deal, no fee</p>
        </div>
      </div>
    </section>
  );
}
