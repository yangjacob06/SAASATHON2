import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { FieldShell, Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { completeSettlementAction } from "@/lib/actions/lenders";
import { requireAdviser } from "@/lib/auth";
import { feeCents, FEE_BPS, FEE_PAYER, formatNZD } from "@/lib/fees";
import { one, query } from "@/lib/db";
import type { Application } from "@/lib/types";

export const metadata = { title: "Record settlement" };

export default async function RecordSettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const adviser = await requireAdviser();
  const { id } = await params;
  const application = await one<Application>(`SELECT * FROM applications WHERE id = $1 AND adviser_id = $2`, [id, adviser.id]);
  if (!application) redirect("/app");
  if (application.status !== "approved") redirect(`/app/applications/${id}`);
  const lenders = await query<{ id: string; name: string }>(
    `SELECT DISTINCT l.id, l.name FROM lenders l JOIN deal_shares s ON s.lender_id = l.id
      JOIN users u ON u.id = l.owner_user_id
     WHERE s.application_id = $1 AND u.account_status = 'active' ORDER BY l.name`,
    [id],
  );
  const estimatedFee = feeCents(application.loan_amount_cents);
  const payer = { lender: "the lender", adviser: "the adviser", borrower: "the borrower" }[FEE_PAYER];

  return (
    <div className="mx-auto max-w-2xl">
      <a href={`/app/applications/${id}`} className="text-[13px] text-grey hover:text-graphite">← Back to deal</a>
      <p className="eyebrow mt-6">Settlement record</p>
      <h1 className="mt-3 font-display text-3xl text-graphite">Record the facility that settled</h1>
      <p className="mt-2 text-[14px] text-grey">{application.client_name} · requested {formatNZD(application.loan_amount_cents)}</p>
      <Card className="mt-7 p-7">
        <p className="text-[13px] leading-relaxed text-graphite-soft">Enter the funded facility amount, rather than the original request. Mandate calculates {FEE_BPS} bps on that amount, excluding GST, payable by {payer}. This creates a fee record; it does not charge a card or confirm payment.</p>
        <p className="mt-3 rounded-lg bg-paper-soft px-4 py-3 text-[13px] text-grey">If the requested amount settled unchanged, the fee would be {formatNZD(estimatedFee)} + GST.</p>
        <form action={completeSettlementAction} className="mt-6 space-y-4">
          <input type="hidden" name="application_id" value={id} />
          <FieldShell label="Settled facility amount (NZD)"><Input name="facility_amount" type="number" min="1" step="1000" defaultValue={application.loan_amount_cents / 100} required /></FieldShell>
          <FieldShell label="Settlement date"><Input name="settled_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></FieldShell>
          <FieldShell label="Fund that provided the facility" hint={FEE_PAYER === "lender" ? "Required for the configured lender-paid fee" : "Optional"}>
            <Select name="lender_id" required={FEE_PAYER === "lender"} defaultValue="">
              <option value="">Select a Mandate lender</option>
              {lenders.map((lender) => <option key={lender.id} value={lender.id}>{lender.name}</option>)}
              <option value="external">A lender outside Mandate</option>
            </Select>
          </FieldShell>
          <FieldShell label="Internal reference (optional)"><Input name="reference" maxLength={120} /></FieldShell>
          <SubmitButton pendingLabel="Saving settlement…">Save settlement and fee</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
