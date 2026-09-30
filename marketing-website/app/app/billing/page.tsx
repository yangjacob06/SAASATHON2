import { Card } from "@/components/ui/Card";
import { requireLender, requireUser } from "@/lib/auth";
import { feeExample, FEE_BPS, FEE_PAYER, formatNZD } from "@/lib/fees";
import { query } from "@/lib/db";
import type { SettlementRecord } from "@/lib/types";

export const metadata = { title: "Settlement fees" };

type FeeRow = SettlementRecord & { client_name: string; adviser_id: string; lender_name: string | null };

export default async function FeePage() {
  const user = await requireUser();
  let records: FeeRow[] = [];
  if (user.account_type === "adviser") {
    records = await query<FeeRow>(
      `SELECT s.*, a.client_name, a.adviser_id, l.name AS lender_name FROM settlement_records s
         JOIN applications a ON a.id = s.application_id LEFT JOIN lenders l ON l.id = s.lender_id
        WHERE a.adviser_id = $1 ORDER BY s.settled_at DESC`, [user.id],
    );
  } else if (FEE_PAYER === "lender" && user.lender_id) {
    await requireLender();
    records = await query<FeeRow>(
      `SELECT s.*, a.client_name, a.adviser_id, l.name AS lender_name FROM settlement_records s
         JOIN applications a ON a.id = s.application_id LEFT JOIN lenders l ON l.id = s.lender_id
        WHERE s.lender_id = $1 AND s.fee_payer = 'lender' ORDER BY s.settled_at DESC`, [user.lender_id],
    );
  }
  const payerLabel = { lender: "the lender", adviser: "the adviser", borrower: "the borrower" }[FEE_PAYER];
  const emptyMessage = user.account_type === "lender" && FEE_PAYER !== "lender"
    ? `The configured fee is payable by ${payerLabel}; lender fee records are not shown in this account.`
    : "No settlements recorded yet. The fee is calculated from the funded amount when an adviser records a settled deal.";

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Mandate marketplace</p><h1 className="mt-3 font-display text-3xl text-graphite">Settlement fees</h1>
      <p className="mt-2 max-w-2xl text-[14px] text-grey">Mandate is free to join and use. A {FEE_BPS} basis point success fee is recorded only when a facility settles; the fee is calculated excluding GST and is payable by {payerLabel}.</p>
      <Card className="mt-6 p-6 sm:p-8"><p className="eyebrow-quiet">Worked example</p><p className="mt-4 font-display text-xl leading-snug text-graphite sm:text-2xl">{feeExample()}</p><p className="mt-3 text-[12.5px] text-grey">Done-for-you deal packs (paid add-on, pricing on request).</p></Card>
      <div className="mt-9"><h2 className="font-display text-xl text-graphite">Settled facilities</h2>
        {records.length === 0 ? <Card className="mt-4 p-7"><p className="text-[14px] text-grey">{emptyMessage}</p></Card> : (
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-rule bg-paper-lift"><table className="w-full min-w-[620px] text-left text-[13px]"><thead><tr className="border-b border-rule bg-paper-soft text-[11px] uppercase tracking-wide text-grey"><th className="px-4 py-3">Deal</th><th className="px-4 py-3">Funded facility</th><th className="px-4 py-3">Settled</th><th className="px-4 py-3">Fund</th><th className="px-4 py-3">Fee excl. GST</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-rule last:border-0"><td className="px-4 py-3 font-medium text-graphite">{record.client_name}</td><td className="px-4 py-3">{formatNZD(record.facility_amount_cents)}</td><td className="px-4 py-3">{new Date(record.settled_at).toLocaleDateString("en-NZ", { dateStyle: "medium" })}</td><td className="px-4 py-3">{record.lender_name || "Outside Mandate"}</td><td className="px-4 py-3 font-medium">{formatNZD(record.fee_amount_cents)}</td></tr>)}</tbody></table></div>
        )}
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-grey">This ledger records the agreed fee basis; it does not process payments or confirm collection. GST is added to the fee where applicable.</p>
    </div>
  );
}
