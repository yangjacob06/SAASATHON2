import { Compass, Document, Lock, Timeline } from "@/components/ui/Icons";

/**
 * What the product does, as four panels of unequal weight.
 *
 * The first panel spans two columns and carries a worked example; the other
 * three are supporting. Equal cards in a 3-up row are the house style of
 * every template on the internet — the asymmetry is the point, and it also
 * matches how much there actually is to say about each capability.
 */

const SUPPORTING = [
  {
    icon: Compass,
    title: "Lenders ranked, with reasons",
    body: "Every application is scored against a directory of New Zealand non-bank lenders — loan size, region, LVR, pre-sales — with a plain-English reason for each placing.",
  },
  {
    icon: Timeline,
    title: "Every next step in view",
    body: "Applications, lender conversations and follow-ups sit on one timeline, so nothing waits on a call that was never made.",
  },
  {
    icon: Lock,
    title: "Confidential by default",
    body: "Client documents stay inside your account. A summary reaches a lender because you sent it, never because the software decided to.",
  },
];

export function FeatureGrid() {
  return (
    <section id="product" className="section relative border-t border-rule">
      <div className="shell">
        <header className="max-w-2xl">
          <p data-reveal="fade" className="eyebrow">
            Designed for the work behind the deal
          </p>
          <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-graphite">
            One workspace.
            <br />
            <span className="accent">Every moving part.</span>
          </h2>
          <p data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties} className="lede mt-5">
            The four jobs that take an adviser&rsquo;s afternoon, each given somewhere proper to
            live.
          </p>
        </header>

        <div className="mt-14 grid gap-4 sm:mt-20">
          {/* ── The wide one: copy and a crop of its own output ────── */}
          <article
            data-reveal
            className="group grid overflow-hidden rounded-[var(--radius-panel)] border border-rule bg-paper-lift shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:border-rule-strong hover:shadow-[var(--shadow-lift)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
          >
            <div className="p-7 sm:p-10 lg:self-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-signal-soft text-graphite">
                <Document size={19} />
              </span>
              <h3 className="headline mt-6 max-w-md text-(length:--text-h3) text-graphite">
                A lender-ready summary, drafted from the file you already have
              </h3>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-grey">
                Upload the valuation, feasibility study and financials once. Mandate reads them
                beside your form fields and drafts the one-page summary — request, security, LVR,
                strengths, risks, and what is still missing — ready for you to edit and sign off.
              </p>
            </div>

            {/* The output itself, cropped by the panel edge rather than shrunk. */}
            <div className="relative flex items-center overflow-hidden border-rule bg-paper-lift p-7 sm:p-10 lg:border-l">
              <div className="-mr-7 w-full rounded-l-[var(--radius-card)] border-y border-l border-rule bg-paper-lift p-6 shadow-[var(--shadow-card)] transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:-translate-y-1 sm:-mr-10">
                <p className="eyebrow-quiet">Deal summary · draft</p>
                <p className="headline mt-2 text-[20px] text-graphite">Harbour View Townhomes</p>
                <p className="nums mt-1 text-[12.5px] text-grey">
                  NZ$8.0m · Development · Canterbury · 65% LVR
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Loan request", w: "92%" },
                    { label: "Security position", w: "78%" },
                    { label: "Strengths and risks", w: "86%" },
                    { label: "Outstanding items", w: "54%" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-[11.5px] text-grey">{row.label}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-rule/70">
                        <span
                          className="block h-full rounded-full bg-signal/60"
                          style={{ width: row.w }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-rule pt-3 text-[11px] text-grey-light">
                  Illustrative draft · every summary is yours to edit before it leaves
                </p>
              </div>
            </div>
          </article>

          {/* ── Supporting ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            {SUPPORTING.map((f, i) => (
              <article
                key={f.title}
                data-reveal
                style={{ "--reveal-delay": `${80 + i * 70}ms` } as React.CSSProperties}
                className="rounded-[var(--radius-panel)] border border-rule bg-paper-lift p-6 transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-card)] sm:p-7"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] bg-paper-soft text-graphite">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-5 text-[15.5px] font-semibold leading-snug text-graphite">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-grey">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
