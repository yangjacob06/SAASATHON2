import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { FieldShell, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { respondToDealAction } from "@/lib/actions/lenders";
import { requireLender } from "@/lib/auth";
import { formatMoneyCents, PURPOSE_LABEL } from "@/lib/status";
import { one } from "@/lib/db";

export const metadata = { title: "Shared deal" };

interface SharedDeal {
  id: string; shared_at: string; response: "interested" | "pass" | null; response_note: string;
  client_name: string; loan_amount_cents: number; purpose: string; location: string; property_value_cents: number | null;
  pre_sales_pct: number | null; loan_term_months: number | null; notes: string; summary: string | null;
  adviser_name: string; adviser_email: string; firm_name: string;
}

export default async function SharedDealPage({ params }: { params: Promise<{ shareId: string }> }) {
  const user = await requireLender();
  const { shareId } = await params;
  const deal = await one<SharedDeal>(
    `SELECT s.id, s.shared_at, s.response, s.response_note, a.client_name, a.loan_amount_cents, a.purpose, a.location,
            a.property_value_cents, a.pre_sales_pct, a.loan_term_months, a.notes, ds.content AS summary,
            u.name AS adviser_name, u.email AS adviser_email, u.firm_name
       FROM deal_shares s JOIN applications a ON a.id = s.application_id
       JOIN users u ON u.id = a.adviser_id
       LEFT JOIN deal_summaries ds ON ds.application_id = a.id
      WHERE s.id = $1 AND s.lender_id = $2 AND s.revoked_at IS NULL`,
    [shareId, user.lender_id],
  );
  if (!deal) notFound();
  const purpose = PURPOSE_LABEL[deal.purpose as keyof typeof PURPOSE_LABEL] || deal.purpose;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <a href="/app/inbox" className="text-[13px] text-grey hover:text-graphite">← Deal inbox</a>
      <div><p className="eyebrow">Shared by {deal.firm_name || deal.adviser_name}</p><h1 className="mt-3 font-display text-3xl text-graphite">{deal.client_name}</h1><p className="mt-1 text-[14px] text-grey">{purpose} · {deal.location || "Location not supplied"}</p></div>
      <Card className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-[11px] uppercase tracking-wide text-grey">Facility sought</p><p className="mt-1 font-display text-xl text-graphite">{formatMoneyCents(deal.loan_amount_cents)}</p></div>
        <div><p className="text-[11px] uppercase tracking-wide text-grey">Security value</p><p className="mt-1 font-medium text-graphite">{formatMoneyCents(deal.property_value_cents)}</p></div>
        <div><p className="text-[11px] uppercase tracking-wide text-grey">Pre-sales</p><p className="mt-1 font-medium text-graphite">{deal.pre_sales_pct == null ? "Not provided" : `${deal.pre_sales_pct}%`}</p></div>
        <div><p className="text-[11px] uppercase tracking-wide text-grey">Term</p><p className="mt-1 font-medium text-graphite">{deal.loan_term_months ? `${deal.loan_term_months} months` : "Not provided"}</p></div>
      </Card>
      {deal.summary && <Card className="p-6"><h2 className="font-display text-xl text-graphite">Deal summary</h2><div className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-graphite-soft">{deal.summary}</div></Card>}
      {deal.notes && <Card className="p-6"><h2 className="font-display text-lg text-graphite">Adviser notes</h2><p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-graphite-soft">{deal.notes}</p></Card>}
      <Card className="p-6">
        <div><h2 className="font-display text-xl text-graphite">Respond to the adviser</h2><p className="mt-1 text-[13px] text-grey">Source documents are not included. Contact the adviser if you need additional information.</p><p className="mt-3 text-[13px] text-graphite-soft">{deal.adviser_name} · <a className="underline" href={`mailto:${deal.adviser_email}`}>{deal.adviser_email}</a></p></div>
        <form action={respondToDealAction} className="mt-5"><input type="hidden" name="share_id" value={deal.id} /><FieldShell label="Note to adviser (optional)"><Textarea name="response_note" rows={3} defaultValue={deal.response_note} placeholder="What would you need to assess this further?" /></FieldShell><div className="mt-4 flex flex-wrap gap-3"><SubmitButton name="response" value="interested" pendingLabel="Sending…">Interested — start a conversation</SubmitButton><button type="submit" name="response" value="pass" className="rounded-[var(--radius-control)] border border-rule-strong px-4 py-2.5 text-[13px] font-medium text-graphite-soft">Pass on this deal</button></div><p className="mt-3 text-[12px] text-grey">Current response: {deal.response ? (deal.response === "interested" ? "Interested" : "Passed") : "Not responded"}</p></form>
      </Card>
    </div>
  );
}
