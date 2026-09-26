import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatMoneyCents } from "@/lib/status";

export const metadata = { title: "Lender response patterns" };

interface LenderEventRow {
  match_id: string;
  application_id: string;
  lender_name: string;
  loan_amount_cents: number;
  event_type: string;
  occurred_at: string;
}

export default async function LenderHistoryPage() {
  const user = await requireUser();
  const events = await query<LenderEventRow>(
    `SELECT ale.application_lender_id AS match_id, al.application_id, l.name AS lender_name,
            a.loan_amount_cents, ale.event_type, ale.occurred_at
       FROM application_lender_events ale
       JOIN application_lenders al ON al.id = ale.application_lender_id
       JOIN applications a ON a.id = al.application_id
       JOIN lenders l ON l.id = al.lender_id
      WHERE a.adviser_id = $1
      ORDER BY ale.occurred_at ASC`,
    [user.id],
  );

  const matches = new Map<string, {
    applicationId: string;
    lenderName: string;
    amount: number;
    contactedAt?: number;
    respondedAt?: number;
  }>();
  for (const event of events) {
    const match = matches.get(event.match_id) ?? {
      applicationId: event.application_id,
      lenderName: event.lender_name,
      amount: Number(event.loan_amount_cents),
    };
    const at = new Date(event.occurred_at).getTime();
    if (event.event_type === "contacted" && match.contactedAt === undefined) match.contactedAt = at;
    if (event.event_type === "response" && match.respondedAt === undefined) match.respondedAt = at;
    matches.set(event.match_id, match);
  }

  const byLender = new Map<string, { deals: Set<string>; amounts: number[]; contacts: number; responses: number; replyDays: number[] }>();
  for (const match of matches.values()) {
    const row = byLender.get(match.lenderName) ?? { deals: new Set<string>(), amounts: [], contacts: 0, responses: 0, replyDays: [] };
    row.deals.add(match.applicationId);
    row.amounts.push(match.amount);
    if (match.contactedAt !== undefined) {
      row.contacts += 1;
      if (match.respondedAt !== undefined && match.respondedAt >= match.contactedAt) {
        row.responses += 1;
        row.replyDays.push((match.respondedAt - match.contactedAt) / 86_400_000);
      }
    }
    byLender.set(match.lenderName, row);
  }

  const rows = [...byLender.entries()].map(([name, row]) => ({
    name,
    deals: row.deals.size,
    averageAmount: row.amounts.length ? row.amounts.reduce((sum, amount) => sum + amount, 0) / row.amounts.length : 0,
    contacts: row.contacts,
    responses: row.responses,
    replyRate: row.contacts ? row.responses / row.contacts : null,
    averageReplyDays: row.replyDays.length ? row.replyDays.reduce((sum, days) => sum + days, 0) / row.replyDays.length : null,
    replySamples: row.replyDays.length,
  })).sort((a, b) => b.contacts - a.contacts || b.deals - a.deals || a.name.localeCompare(b.name));

  const applications = new Set([...matches.values()].map((match) => match.applicationId));
  const contacts = rows.reduce((sum, row) => sum + row.contacts, 0);
  const responses = rows.reduce((sum, row) => sum + row.responses, 0);
  const replyDays = rows.flatMap((row) => row.averageReplyDays === null ? [] : Array.from({ length: row.replySamples }, () => row.averageReplyDays!));
  const averageReply = replyDays.length ? replyDays.reduce((sum, days) => sum + days, 0) / replyDays.length : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/app" className="text-[12px] font-medium text-sky hover:underline">← Back to deals</Link>
          <h1 className="mt-2 font-display text-3xl text-graphite">Lender response patterns</h1>
          <p className="mt-1 text-[14px] text-grey">See which lenders have been approached, how often they respond and typical reply time.</p>
        </div>
        <p className="text-[11px] text-grey">Demo account records are fictional.</p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Deals with lender activity", String(applications.size)],
          ["Lender approaches", String(contacts)],
          ["Response rate", contacts ? `${Math.round((responses / contacts) * 100)}%` : "No data"],
          ["Average first reply", averageReply === null ? "No data" : `${averageReply.toFixed(1)} days`],
        ].map(([label, value]) => (
          <Card key={label} className="px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-grey">{label}</p>
            <p className="mt-1 font-display text-2xl text-graphite">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 overflow-x-auto">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[14px] font-medium text-graphite">No lender response history yet</p>
            <p className="mt-1 text-[12.5px] text-grey">When you mark a matched lender as Contacted, Interested or Declined, its activity will appear here.</p>
          </div>
        ) : (
          <table className="w-full min-w-[850px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-rule bg-paper-soft text-[10.5px] uppercase tracking-wide text-grey">
                <th className="px-5 py-3 font-medium">Lender</th>
                <th className="px-5 py-3 font-medium">Deals matched</th>
                <th className="px-5 py-3 font-medium">Avg. matched request</th>
                <th className="px-5 py-3 font-medium">Approached</th>
                <th className="px-5 py-3 font-medium">Response rate</th>
                <th className="px-5 py-3 font-medium">Avg. first reply</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-rule last:border-0">
                  <td className="px-5 py-3 font-medium text-graphite">{row.name}</td>
                  <td className="px-5 py-3 text-graphite-soft">{row.deals}</td>
                  <td className="px-5 py-3 text-graphite-soft">{formatMoneyCents(row.averageAmount)}</td>
                  <td className="px-5 py-3 text-graphite-soft">{row.contacts}</td>
                  <td className="px-5 py-3 text-graphite-soft">{row.replyRate === null ? "No contact data" : `${Math.round(row.replyRate * 100)}% (${row.responses}/${row.contacts})`}</td>
                  <td className="px-5 py-3 text-graphite-soft">{row.averageReplyDays === null ? "No reply data" : `${row.averageReplyDays.toFixed(1)} days · ${row.replySamples} ${row.replySamples === 1 ? "reply" : "replies"}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="mt-3 text-[11px] text-grey">Reply time is measured from the first Contacted event to the first recorded response on that lender match. Response patterns are descriptive history, not a guarantee of future timing.</p>
    </div>
  );
}
