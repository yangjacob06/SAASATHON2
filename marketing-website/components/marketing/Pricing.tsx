import { feeExample, FEE_BPS, FEE_PAYER } from "@/lib/fees";

export function Pricing() {
  const payer = { lender: "the lender", adviser: "the adviser", borrower: "the borrower" }[FEE_PAYER];
  return (
    <section id="pricing" className="section border-t border-rule">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <header className="lg:col-span-5">
          <p data-reveal="fade" className="eyebrow">Simple settlement pricing</p>
          <h2 data-reveal className="headline mt-4 text-(length:--text-h2) text-graphite">
            Free to use. <span className="accent">Pay when it settles.</span>
          </h2>
          <p data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties} className="lede mt-5 max-w-md">
            Joining Mandate and preparing or matching deals is free. A success fee of {FEE_BPS} basis points ({FEE_BPS / 100}%) applies only when a facility settles. The fee is payable by {payer} and is calculated on the facility amount, excluding GST.
          </p>
        </header>
        <div data-reveal className="lg:col-span-7 rounded-[var(--radius-panel)] border border-rule bg-paper-lift p-7 shadow-[var(--shadow-card)] sm:p-9">
          <p className="eyebrow-quiet">One fee · only on settlement</p>
          <p className="mt-5 font-display text-2xl leading-snug text-graphite sm:text-3xl">{feeExample()}</p>
          <p className="mt-4 text-[13px] leading-relaxed text-grey">Fee shown excluding GST. No deal, no fee.</p>
          <div className="mt-7 border-t border-rule pt-5 text-[14px] text-graphite-soft">
            Done-for-you deal packs <span className="text-grey">(paid add-on, pricing on request)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
