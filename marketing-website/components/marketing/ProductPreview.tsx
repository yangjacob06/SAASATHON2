import Link from "next/link";

import { ArrowRight, Building } from "@/components/ui/Icons";
import { Parallax } from "@/components/ui/Parallax";

/**
 * The pipeline view, shown rather than described.
 *
 * Mirrored against the hero — frame on the left, copy on the right — so the
 * page alternates weight down its length instead of stacking the same
 * composition twice. Sample data throughout, marked as such in the frame.
 */

const ROWS = [
  { name: "Harbour View Townhomes", kind: "Development · Canterbury", amount: "$8.0m", stage: "Summary ready", tone: "go" },
  { name: "Westgate Industrial", kind: "Commercial property · Auckland", amount: "$4.5m", stage: "Sent", tone: "sky" },
  { name: "Southern Foods Ltd", kind: "Business acquisition · Dunedin", amount: "$2.2m", stage: "Term sheet", tone: "violet" },
  { name: "Central City Offices", kind: "Refinance · Wellington", amount: "$11.0m", stage: "Draft", tone: "muted" },
] as const;

const TONES: Record<string, string> = {
  go: "bg-go-soft text-go",
  sky: "bg-sky-soft text-sky",
  violet: "bg-violet-soft text-violet",
  muted: "bg-paper-soft text-grey",
};

// Deliberately irregular so the bars read as a real month, not as decoration.
const BARS = [38, 52, 44, 67, 58, 81, 72, 63, 88, 76, 94, 84];

export function ProductPreview() {
  return (
    <section className="section relative overflow-hidden border-t border-rule bg-paper-lift">
      <div className="shell grid items-center gap-14 lg:grid-cols-12 lg:gap-14">
        {/* ── The frame ─────────────────────────────────────────────── */}
        <div
          data-reveal="scale"
          className="order-2 lg:order-1 lg:col-span-7 xl:-ml-16 2xl:-ml-24"
        >
          <Parallax speed={0.035}>
            <div className="overflow-hidden rounded-[var(--radius-panel)] border border-rule bg-paper-lift shadow-[var(--shadow-float)]">
              {/* Window chrome, kept to a whisper. */}
              <div className="flex items-center gap-3 border-b border-rule bg-paper-lift px-4 py-3">
                <span className="flex gap-1.5">
                  {["#e0dccf", "#e0dccf", "#e0dccf"].map((c, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </span>
                <span className="mx-auto text-[11.5px] text-grey-light">Mandate · Applications</span>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow-quiet">Sample pipeline</p>
                    <h3 className="headline mt-1.5 text-[24px] text-graphite">Your applications</h3>
                  </div>
                  <span className="rounded-[var(--radius-control)] bg-graphite px-3 py-1.5 text-[12px] font-medium text-paper">
                    New application
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Active deals" value="08" note="Across 4 stages" />
                  <Stat label="Indicative funding" value="$24.7m" note="Illustrative only" />
                  <div className="rounded-[var(--radius-card)] border border-rule bg-paper-lift p-4">
                    <p className="text-[11.5px] text-grey">Pipeline</p>
                    <div className="mt-3 flex h-10 items-end gap-1">
                      {BARS.map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm bg-signal/35"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-[12.5px] font-medium text-graphite-soft">Recent applications</p>
                  <span className="text-[12px] text-grey">View all</span>
                </div>

                <ul className="mt-2 divide-y divide-rule border-t border-rule">
                  {ROWS.map((r) => (
                    <li key={r.name} className="flex items-center gap-3 py-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-paper-soft text-grey">
                        <Building size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-graphite">{r.name}</span>
                        <span className="block truncate text-[11.5px] text-grey">{r.kind}</span>
                      </span>
                      <span className="nums hidden text-[13px] font-medium text-graphite sm:block">{r.amount}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${TONES[r.tone]}`}>
                        {r.stage}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-right text-[10.5px] uppercase tracking-[0.14em] text-grey-light">
                  Illustrative product preview
                </p>
              </div>
            </div>
          </Parallax>
        </div>

        {/* ── Copy ──────────────────────────────────────────────────── */}
        <div className="order-1 lg:order-2 lg:col-span-5">
          <p data-reveal="fade" className="eyebrow">
            A considered view of every deal
          </p>
          <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-graphite">
            From first look
            <br />
            to <span className="accent">next step.</span>
          </h2>
          <p
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
            className="lede mt-5 max-w-md"
          >
            Open Mandate and the whole pipeline is already in front of you — what is drafted, what
            is with a lender, what is waiting on you. The detail is a click away when you want it
            and out of the way when you don&rsquo;t.
          </p>

          <ul
            data-reveal
            style={{ "--reveal-delay": "150ms" } as React.CSSProperties}
            className="mt-8 space-y-3 border-t border-rule pt-6"
          >
            {[
              "Stages that match how a deal actually moves",
              "Documents and notes attached to the application, not an inbox",
              "Reminders on the follow-ups that slip",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[14.5px] text-graphite-soft">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-graphite" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            data-reveal
            style={{ "--reveal-delay": "210ms" } as React.CSSProperties}
            href="/signup"
            className="nudge-right mt-9 inline-flex items-center gap-2 text-[14px] font-medium text-graphite"
          >
            <span className="rule-link">Explore the product</span>
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-paper-lift p-4">
      <p className="text-[11.5px] text-grey">{label}</p>
      <p className="nums mt-1.5 font-display text-[26px] leading-none text-graphite">{value}</p>
      <p className="mt-1.5 text-[11px] text-grey-light">{note}</p>
    </div>
  );
}
