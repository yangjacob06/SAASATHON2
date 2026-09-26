import Link from "next/link";

import { DealMatchPanel } from "@/components/marketing/DealMatchPanel";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icons";
import { Parallax } from "@/components/ui/Parallax";

/**
 * The hero.
 *
 * Asymmetric by design: the headline holds seven columns on the left and the
 * product composition floats over the remaining five, breaking the container
 * on the right at large sizes so the panel reads as a real object sitting on
 * the page rather than a picture placed inside a box.
 *
 * On load, the eyebrow, each headline line, the lede and the actions arrive
 * in sequence — one staged reveal, roughly 500ms end to end, rather than
 * four independent animations.
 */

const PROOF = ["Built in Christchurch", "Confidential by default", "Adviser-first"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-32 sm:pb-16 sm:pt-36 lg:pb-20 lg:pt-40">
      {/* Ground: hairline grid, faded out before it reaches any edge. */}
      <div
        aria-hidden="true"
        className="blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
      />
      {/* A single soft wash of brand colour — no glow, no blob. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-56 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgb(23_80_58/0.07),transparent_65%)]"
      />

      <div className="shell relative">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* ── Copy ──────────────────────────────────────────────── */}
          <div className="lg:col-span-6 xl:col-span-6">
            <p
              data-reveal="fade"
              className="inline-flex items-center gap-2.5 rounded-full border border-rule bg-signal-soft/60 py-1.5 pl-2.5 pr-4"
            >
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="eyebrow">
                Private-credit workflow<span className="hidden sm:inline"> · New Zealand</span>
              </span>
            </p>

            <h1 data-reveal="fade" className="display mt-7 text-(length:--text-display) text-graphite">
              {["Prepare, match", "and track deals"].map((line, i) => (
                <span key={line} className="reveal-line">
                  <span style={{ "--reveal-delay": `${120 + i * 90}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              ))}
              <span className="reveal-line">
                <span
                  className="accent"
                  style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
                >
                  in minutes.
                </span>
              </span>
            </h1>

            <p
              data-reveal
              style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
              className="lede mt-7 max-w-xl"
            >
              Mandate is one calm workspace for New Zealand commercial finance advisers: organise
              the application, draft a lender-ready summary from the documents you already have,
              and keep every deal moving toward settlement.
            </p>

            <div
              data-reveal
              style={{ "--reveal-delay": "460ms" } as React.CSSProperties}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                className="nudge inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-graphite px-6 py-3.5 sm:w-auto text-[14px] font-medium text-paper shadow-[0_10px_30px_-14px_rgb(23_80_58/0.7)] transition-[background-color,transform,box-shadow] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px hover:bg-graphite"
              >
                Start your 14-day free trial
                <ArrowUpRight />
              </Link>
              <a
                href="#how-it-works"
                className="nudge-right inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-rule-strong bg-paper-lift px-6 py-3.5 sm:w-auto text-[14px] font-medium text-graphite transition-[border-color,transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px hover:border-graphite"
              >
                See how it works
                <ArrowRight />
              </a>
            </div>

            <p
              data-reveal="fade"
              style={{ "--reveal-delay": "540ms" } as React.CSSProperties}
              className="mt-8 text-[13px] text-grey"
            >
              No card required. Bring your first deal and see the summary it drafts.
            </p>
          </div>

          {/* ── Composition ───────────────────────────────────────── */}
          <div
            data-reveal="scale"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
            className="lg:col-span-6 xl:col-span-6 xl:-mr-16 2xl:-mr-28"
          >
            <Parallax speed={0.045}>
              <DealMatchPanel />
            </Parallax>
          </div>
        </div>
      </div>

      {/* ── Quiet proof rule ────────────────────────────────────────── */}
      <div className="shell relative mt-16 sm:mt-20">
        <ul
          data-reveal="fade"
          className="flex flex-wrap items-center gap-x-8 gap-y-2.5 border-t border-rule pt-7 sm:justify-center sm:gap-x-12"
        >
          {PROOF.map((item) => (
            <li key={item} className="eyebrow-quiet">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
