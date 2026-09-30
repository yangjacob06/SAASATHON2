import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { requireLender } from "@/lib/auth";
import { formatMoneyCents, PURPOSE_LABEL } from "@/lib/status";
import { query } from "@/lib/db";

export const metadata = { title: "Deal inbox" };

interface InboxRow {
  id: string; application_id: string; shared_at: string; response: string | null;
  client_name: string; loan_amount_cents: number; purpose: string; location: string; status: string;
}

export default async function LenderInboxPage() {
  const user = await requireLender();
  const deals = await query<InboxRow>(
    `SELECT s.id, s.application_id, s.shared_at, s.response, a.client_name, a.loan_amount_cents, a.purpose, a.location, a.status
       FROM deal_shares s JOIN applications a ON a.id = s.application_id
      WHERE s.lender_id = $1 AND s.revoked_at IS NULL
      ORDER BY s.shared_at DESC`,
    [user.lender_id],
  );

  return (
    <div>
      <p className="eyebrow">Private lender workspace</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl text-graphite">Deal inbox</h1><p className="mt-1 text-[14px] text-grey">Deals advisers have deliberately shared with your fund.</p></div>
        <Link href="/app/criteria" className="text-[13px] font-medium text-graphite underline underline-offset-2">Review your lending criteria</Link>
      </div>
      {deals.length === 0 ? (
        <Card className="mt-7 p-10 text-center"><p className="font-display text-xl text-graphite">No deals have been shared yet.</p><p className="mt-2 text-[14px] text-grey">Your fund&rsquo;s current lending criteria help advisers find a fit. Deals appear here only after an adviser chooses to share them.</p><Link className="mt-5 inline-block text-[13px] font-medium text-graphite underline underline-offset-2" href="/app/criteria">Update lending criteria</Link></Card>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {deals.map((deal) => <Link key={deal.id} href={`/app/inbox/${deal.id}`} className="block"><Card className="h-full p-6 transition-colors hover:border-rule-strong">
            <div className="flex items-start justify-between gap-3"><h2 className="font-display text-xl text-graphite">{deal.client_name}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] ${deal.response === "interested" ? "bg-go-soft text-go" : deal.response === "pass" ? "bg-paper-soft text-grey" : "bg-signal-soft text-graphite"}`}>{deal.response === "interested" ? "Interested" : deal.response === "pass" ? "Passed" : "New"}</span></div>
            <p className="mt-2 text-[13px] text-grey">{PURPOSE_LABEL[deal.purpose as keyof typeof PURPOSE_LABEL] || deal.purpose} · {deal.location || "Location not supplied"}</p>
            <p className="mt-5 font-display text-2xl text-graphite">{formatMoneyCents(deal.loan_amount_cents)}</p>
            <p className="mt-3 border-t border-rule pt-3 text-[12px] text-grey">Shared {new Date(deal.shared_at).toLocaleDateString("en-NZ", { dateStyle: "medium" })} · Open deal brief →</p>
          </Card></Link>)}
        </div>
      )}
    </div>
  );
}
