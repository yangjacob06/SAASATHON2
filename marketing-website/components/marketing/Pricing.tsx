import Link from "next/link";

import { ArrowUpRight, Check } from "@/components/ui/Icons";
import { PLANS } from "@/lib/billing";

/**
 * Two plans, read off `lib/billing` so the page can never drift from what
 * the app actually charges.
 *
 * The highlighted plan is distinguished by ground, not by a louder border:
 * Pro sits on ink while Starter stays on card, which lets the comparison
 * happen at a glance from across the room.
 */
export function Pricing() {
  const plans = Object.values(PLANS);

  return (
    <section id="pricing" className="section border-t border-rule">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
        <header className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p data-reveal="fade" className="eyebrow">
              Proposed demo pricing
            </p>
            <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-graphite">
              More time for <span className="accent">the right work.</span>
            </h2>
            <p
              data-reveal
              style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
              className="lede mt-5 max-w-sm"
            >
              Start with the essentials, then move to Pro as your deal pipeline grows.
                            Every plan includes a 14-day trial; no card is needed to start.
            </p>
            <p
              data-reveal="fade"
              style={{ "--reveal-delay": "140ms" } as React.CSSProperties}
              className="mt-6 text-[13px] text-grey"
            >
                            NZ dollars per adviser per month, excluding GST. Modelled on overseas CRM tiers; validate with NZ advisers.
            </p>
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
          {plans.map((plan, i) => {
            const pro = plan.id === "pro";
            return (
              <article
                key={plan.id}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
                className={`relative flex flex-col rounded-[var(--radius-panel)] p-7 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-quint)] sm:p-8 ${
                  pro
                    ? "bg-graphite text-paper shadow-[var(--shadow-lift)] hover:-translate-y-1"
                    : "border border-rule bg-paper-lift text-graphite shadow-[var(--shadow-card)] hover:-translate-y-1 hover:border-rule-strong"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      pro ? "text-signal" : "text-graphite"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  {pro && (
                    <span className="rounded-full bg-paper/10 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-paper/70">
                      14-day free trial
                    </span>
                  )}
                </div>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="nums font-display text-[3rem] leading-none">
                    NZ${(plan.priceCents / 100).toFixed(0)}
                  </span>
                                    <span className={`text-[13px] ${pro ? "text-paper/75" : "text-grey"}`}>/ adviser / month</span>
                </p>
                <p className={`mt-3 text-[14px] leading-relaxed ${pro ? "text-paper/75" : "text-grey"}`}>
                  {plan.blurb}
                </p>

                <ul className={`mt-7 flex-1 space-y-3 border-t pt-6 ${pro ? "border-paper/15" : "border-rule"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[14px]">
                      <Check
                        className={`mt-1 shrink-0 ${pro ? "text-signal" : "text-graphite"}`}
                        size={13}
                      />
                      <span className={pro ? "text-paper/90" : "text-graphite-soft"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`nudge mt-8 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 py-3.5 text-[14px] font-medium transition-colors duration-200 ${
                    pro ? "bg-signal text-graphite hover:bg-[#e6f2cc]" : "bg-graphite text-paper hover:bg-graphite"
                  }`}
                >
                  Start free trial
                  <ArrowUpRight />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
