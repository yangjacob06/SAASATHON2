import { Card } from "@/components/ui/Card";
import { approveLenderPartnerAction, rejectLenderPartnerAction } from "@/lib/actions/lenders";
import { requireMarketplaceAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import type { LenderPartnerApplication } from "@/lib/types";

export const metadata = { title: "Lender access review" };

export default async function LenderReviewPage() {
  await requireMarketplaceAdmin();
  const applications = await query<LenderPartnerApplication & { regions: string; loan_types: string }>(
    `SELECT * FROM lender_partner_applications WHERE status = 'pending' ORDER BY created_at ASC`,
  );
  return (
    <div><p className="eyebrow">Marketplace operations</p><h1 className="mt-3 font-display text-3xl text-graphite">Lender access review</h1><p className="mt-2 text-[14px] text-grey">Verify each fund before activating its private deal inbox.</p>
      {applications.length === 0 ? <Card className="mt-7 p-8 text-center text-[14px] text-grey">No lender requests need review.</Card> : <div className="mt-7 space-y-4">{applications.map((row) => <Card key={row.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div><h2 className="font-display text-xl text-graphite">{row.firm_name}</h2><p className="mt-1 text-[13px] text-grey">{row.contact_name} · {row.contact_email}</p><p className="mt-3 text-[13px] text-graphite-soft">NZD {(row.min_loan_cents / 100).toLocaleString("en-NZ")}–{(row.max_loan_cents / 100).toLocaleString("en-NZ")} · max {row.max_lvr_pct}% LVR</p><p className="mt-1 text-[13px] text-graphite-soft">{JSON.parse(row.regions).join(", ")} · {JSON.parse(row.loan_types).join(", ")} · Pre-sales: {row.pre_sales_requirement}</p>{row.notes && <p className="mt-3 text-[13px] leading-relaxed text-grey">{row.notes}</p>}<p className="mt-3 text-[11px] text-grey">Requested {new Date(row.created_at).toLocaleDateString("en-NZ", { dateStyle: "medium" })}</p></div><div className="flex flex-wrap gap-2"><form action={approveLenderPartnerAction}><input type="hidden" name="partner_id" value={row.id} /><button className="rounded-[var(--radius-control)] bg-graphite px-4 py-2.5 text-[13px] font-medium text-paper">Approve fund and activate</button></form><form action={rejectLenderPartnerAction}><input type="hidden" name="partner_id" value={row.id} /><button className="rounded-[var(--radius-control)] border border-rule-strong px-4 py-2.5 text-[13px] font-medium text-grey">Reject</button></form></div></div></Card>)}</div>}
    </div>
  );
}
