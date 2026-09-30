import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { feeExample, FEE_BPS, FEE_PAYER } from "@/lib/fees";

export const metadata = {
  title: "Private credit funds",
  description: "Receive adviser-screened New Zealand private-credit opportunities that fit your lending appetite.",
};

const BENEFITS = [
  ["Relevant deal flow", "Advisers share deals with funds whose loan size, security, geography and credit appetite fit."],
  ["A clear first look", "Review a structured deal brief and lender-ready summary before deciding whether to engage."],
  ["Direct adviser relationship", "Respond to the adviser, request more information and manage the conversation from one inbox."],
];

export default function PublicLendersPage() {
  const payer = { lender: "the lender", adviser: "the adviser", borrower: "the borrower" }[FEE_PAYER];
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-paper-lift">
        <div className="shell flex items-center justify-between py-5">
          <Link href="/" className="font-display text-xl text-graphite">mandate<span className="text-signal">.</span></Link>
          <Link href="/login" className="text-[14px] font-medium text-graphite-soft hover:text-graphite">Sign in</Link>
        </div>
      </header>
      <section className="relative overflow-hidden border-b border-rule">
        <div aria-hidden="true" className="blueprint pointer-events-none absolute inset-0 opacity-60" />
        <div className="shell relative grid gap-12 py-20 sm:py-28 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow">For private credit funds · New Zealand</p>
            <h1 className="display mt-6 max-w-3xl text-(length:--text-display) text-graphite">
              Receive screened deals that fit your mandate<span className="accent">.</span>
            </h1>
            <p className="lede mt-6 max-w-2xl">
              Mandate connects private credit funds with commercial finance advisers bringing prepared borrower opportunities. See the core deal information, assess fit against your lending criteria, and respond directly to the adviser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lenders/join" className="rounded-[var(--radius-control)] bg-graphite px-6 py-3.5 text-[14px] font-medium text-paper hover:opacity-90">Request lender access ↗</Link>
              <Link href="/platform#pricing" className="rounded-[var(--radius-control)] border border-rule-strong bg-paper-lift px-6 py-3.5 text-[14px] font-medium text-graphite">How fees work</Link>
            </div>
            <p className="mt-4 max-w-xl text-[12.5px] leading-relaxed text-grey">Lender accounts are reviewed before activation. Borrower information is shared only when the adviser chooses to send a deal to your fund; source documents are not shared by default.</p>
          </div>
          <Card className="relative p-7 sm:p-8 lg:col-span-5">
            <p className="eyebrow-quiet">A considered route to the right deals</p>
            <div className="mt-6 space-y-5">
              {BENEFITS.map(([title, body], i) => (
                <div key={title} className="flex gap-4 border-t border-rule pt-5">
                  <span className="font-display text-xl text-signal">0{i + 1}</span>
                  <div><h2 className="font-medium text-graphite">{title}</h2><p className="mt-1 text-[13px] leading-relaxed text-grey">{body}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      <section className="shell grid gap-12 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-5"><p className="eyebrow">Aligned incentives</p><h2 className="headline mt-4 text-(length:--text-h2) text-graphite">Free to use. Pay only on a settled facility.</h2></div>
        <div className="lg:col-span-7 rounded-[var(--radius-panel)] border border-rule bg-paper-lift p-7 sm:p-9">
          <p className="eyebrow-quiet">{FEE_BPS} basis points · settlement only</p>
          <p className="mt-5 font-display text-2xl leading-snug text-graphite sm:text-3xl">{feeExample()}</p>
          <p className="mt-4 text-[13px] text-grey">Fee shown excluding GST. No deal, no fee. The configured payer is {payer}; commercial terms should be agreed before participation.</p>
        </div>
      </section>
      <footer className="border-t border-rule py-8"><div className="shell flex flex-wrap justify-between gap-4 text-[12.5px] text-grey"><span>Mandate · Christchurch, New Zealand</span><Link href="/privacy">Privacy</Link></div></footer>
    </main>
  );
}
