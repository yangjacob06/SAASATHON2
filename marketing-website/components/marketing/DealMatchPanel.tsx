import { Building, Clock, Pin, Spark } from "@/components/ui/Icons";

/**
 * The hero's product composition: one deal brief on the left, the lender
 * fits it produces on the right, joined by the matching curves.
 *
 * Drawn in markup rather than shipped as a screenshot so it stays crisp at
 * any density, re-flows on a phone, and inherits the site's own tokens —
 * a screenshot of a product is a picture of software, but this reads as the
 * software itself. Every figure is sample data and labelled as such.
 */

const FITS = [
  {
    key: "A",
    name: "Fund A",
    kind: "Property development",
    score: 92,
    reasons: ["Canterbury lending", "No pre-sales required"],
  },
  {
    key: "B",
    name: "Fund B",
    kind: "Short-term property",
    score: 86,
    reasons: ["Up to NZ$15m", "Ground-up development"],
  },
  {
    key: "C",
    name: "Fund C",
    kind: "Commercial property",
    score: 78,
    reasons: ["Regional appetite", "Senior secured"],
  },
];

export function DealMatchPanel() {
  return (
    <figure className="relative rounded-[var(--radius-panel)] border border-rule bg-paper-lift/95 p-5 shadow-[var(--shadow-float)] backdrop-blur-sm sm:p-7">
      <figcaption className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2.5">
          <Spark className="text-graphite" size={17} />
          <span className="eyebrow">A clearer view of lender fit</span>
        </span>
        <span className="hidden shrink-0 rounded-full border border-rule px-3 py-1 text-[11px] text-grey sm:inline-block">
          Sample deal
        </span>
      </figcaption>

      <p className="mt-2.5 text-[13.5px] text-grey">From one deal brief to the options worth a call.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1.15fr)] lg:gap-0">
        {/* ── The brief ─────────────────────────────────────────────── */}
        <div className="rounded-[var(--radius-card)] border border-rule bg-paper-lift p-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-signal-soft text-graphite">
            <Building size={17} />
          </span>
          <p className="eyebrow-quiet mt-4">Property development</p>
          <p className="headline mt-1.5 text-[26px] text-graphite">Christchurch townhouses</p>
          <p className="nums mt-3 font-display text-[30px] leading-none text-graphite">NZ$8.0m</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {[
              { icon: <Pin />, label: "Canterbury" },
              { icon: <Clock />, label: "3-year term" },
              { icon: null, label: "65% LVR" },
            ].map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper-lift px-2.5 py-1 text-[11.5px] text-graphite-soft"
              >
                {chip.icon && <span className="text-grey">{chip.icon}</span>}
                {chip.label}
              </span>
            ))}
          </div>

          <div className="mt-5 border-t border-rule pt-3">
            <p className="text-[11.5px] text-grey">Security</p>
            <p className="mt-0.5 text-[13px] font-medium text-graphite">First mortgage, residential</p>
          </div>
        </div>

        {/* ── The matching curves ───────────────────────────────────── */}
        <div className="relative hidden lg:block" aria-hidden="true">
          <svg
            className="absolute inset-y-6 left-0 h-[calc(100%-3rem)] w-full text-rule"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M0 50 C 30 50, 70 16, 100 16" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d="M0 50 C 45 50, 55 50, 100 50" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d="M0 50 C 30 50, 70 84, 100 84" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* ── The fits ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {FITS.map((fit) => (
            <div
              key={fit.key}
              className="rounded-[var(--radius-card)] border border-rule bg-paper-lift p-4 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:border-rule hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-rule bg-paper-lift font-display text-[13px] text-graphite">
                  {fit.key}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-tight text-graphite">{fit.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-grey">{fit.kind}</p>
                </div>
                <div className="flex shrink-0 items-baseline gap-1">
                  <span className="nums font-display text-[24px] leading-none text-graphite">{fit.score}</span>
                  <span className="text-[10.5px] text-grey">% fit</span>
                </div>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 pl-10">
                {fit.reasons.map((r) => (
                  <li key={r} className="flex items-center gap-1.5 text-[11.5px] text-grey">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-signal" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4">
        <p className="flex items-center gap-2 text-[11.5px] text-grey">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" />
          Deal criteria scored against each fund&rsquo;s mandate
        </p>
        <p className="text-[11.5px] text-grey-light">Illustrative only · not a lending offer</p>
      </div>
    </figure>
  );
}
