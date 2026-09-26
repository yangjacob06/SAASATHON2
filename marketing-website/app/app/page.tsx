import Link from "next/link";

import { StatusBadge } from "@/components/app/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { activeApplicationLimit, planFor } from "@/lib/billing";
import { query } from "@/lib/db";
import { formatMoneyCents, PURPOSE_LABEL, STATUS_LABEL, ACTIVE_STATUSES } from "@/lib/status";
import type { Application, ApplicationStatus } from "@/lib/types";

export const metadata = { title: "Applications" };

const STATUS_FILTERS: (ApplicationStatus | "all")[] = [
  "all",
  "draft",
  "summary_ready",
  "sent_to_lenders",
  "term_sheet_received",
  "approved",
  "settled",
  "declined",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const { q = "", status = "all" } = await searchParams;

  const conditions = ["adviser_id = $1"];
  const params: unknown[] = [user.id];

  if (q.trim()) {
    params.push(`%${q.trim().toLowerCase()}%`);
    conditions.push(`LOWER(client_name) LIKE $${params.length}`);
  }
  if (status !== "all") {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const applications = await query<Application>(
    `SELECT * FROM applications WHERE ${conditions.join(" AND ")} ORDER BY updated_at DESC`,
    params,
  );

  const lenderEvents = await query<{
    match_id: string;
    application_id: string;
    lender_name: string;
    loan_amount_cents: number;
    event_type: string;
    occurred_at: string;
  }>(
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

  const matchHistory = new Map<string, {
    applicationId: string;
    lenderName: string;
    amount: number;
    contactedAt?: number;
    respondedAt?: number;
  }>();
  for (const event of lenderEvents) {
    const match = matchHistory.get(event.match_id) ?? {
      applicationId: event.application_id,
      lenderName: event.lender_name,
      amount: Number(event.loan_amount_cents),
    };
    const timestamp = new Date(event.occurred_at).getTime();
    if (event.event_type === "contacted" && match.contactedAt === undefined) match.contactedAt = timestamp;
    if (event.event_type === "response" && match.respondedAt === undefined) match.respondedAt = timestamp;
    matchHistory.set(event.match_id, match);
  }
  const lenderHistory = new Map<string, { deals: Set<string>; amounts: number[]; replyDays: number[] }>();
  for (const match of matchHistory.values()) {
    const entry = lenderHistory.get(match.lenderName) ?? { deals: new Set<string>(), amounts: [], replyDays: [] };
    entry.deals.add(match.applicationId);
    entry.amounts.push(match.amount);
    if (match.contactedAt !== undefined && match.respondedAt !== undefined && match.respondedAt >= match.contactedAt) {
      entry.replyDays.push((match.respondedAt - match.contactedAt) / 86_400_000);
    }
    lenderHistory.set(match.lenderName, entry);
  }
  const lenderHistoryRows = [...lenderHistory.entries()]
    .map(([name, history]) => ({
      name,
      dealCount: history.deals.size,
      averageAmount: history.amounts.length ? history.amounts.reduce((sum, amount) => sum + amount, 0) / history.amounts.length : 0,
      averageReplyDays: history.replyDays.length ? history.replyDays.reduce((sum, days) => sum + days, 0) / history.replyDays.length : null,
    }))
    .sort((a, b) => b.dealCount - a.dealCount || a.name.localeCompare(b.name));
  const dealHistory = await query<{ n: number; settled: number; average_amount: number | null }>(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END) AS settled,
            AVG(loan_amount_cents) AS average_amount
       FROM applications WHERE adviser_id = $1`,
    [user.id],
  );

  const activeCountRows = await query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM applications WHERE adviser_id = $1 AND status IN (${ACTIVE_STATUSES.map((_, i) => `$${i + 2}`).join(",")})`,
    [user.id, ...ACTIVE_STATUSES],
  );
  const activeCount = Number(activeCountRows[0]?.n ?? 0);
  const limit = activeApplicationLimit(user);
  const plan = planFor(user);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-graphite">Your deals</h1>
          <p className="mt-1 text-[14px] text-grey">
            {activeCount} active{limit !== null ? ` of ${limit}` : ""}
            {plan ? ` on the ${plan.name} plan` : " on your free trial"}.
          </p>
        </div>
        <ButtonLink href="/app/applications/new">New deal</ButtonLink>
      </div>

      {lenderEvents.length > 0 && (
        <section className="mt-8" aria-labelledby="history-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="history-heading" className="font-display text-xl text-graphite">Six-month deal history</h2>
              <p className="mt-1 text-[12.5px] text-grey">Lender activity recorded across this account. Demo records are fictional.</p>
            </div>
            <span className="text-[11px] text-grey">Reply time runs from contact to first response.</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Deals", String(Number(dealHistory[0]?.n ?? 0))],
              ["Settled", String(Number(dealHistory[0]?.settled ?? 0))],
              ["Average request", formatMoneyCents(Number(dealHistory[0]?.average_amount ?? 0))],
            ].map(([label, value]) => (
              <Card key={label} className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-wide text-grey">{label}</p>
                <p className="mt-1 font-display text-2xl text-graphite">{value}</p>
              </Card>
            ))}
          </div>
          <Card className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-rule bg-paper-soft text-[11px] uppercase tracking-wide text-grey">
                  <th className="px-5 py-3 font-medium">Lender</th>
                  <th className="px-5 py-3 font-medium">Deals matched</th>
                  <th className="px-5 py-3 font-medium">Average matched request</th>
                  <th className="px-5 py-3 font-medium">Average reply</th>
                </tr>
              </thead>
              <tbody>
                {lenderHistoryRows.map((row) => (
                  <tr key={row.name} className="border-b border-rule last:border-0">
                    <td className="px-5 py-3 font-medium text-graphite">{row.name}</td>
                    <td className="px-5 py-3 text-graphite-soft">{row.dealCount}</td>
                    <td className="px-5 py-3 text-graphite-soft">{formatMoneyCents(row.averageAmount)}</td>
                    <td className="px-5 py-3 text-graphite-soft">{row.averageReplyDays === null ? "No reply data" : `${row.averageReplyDays.toFixed(1)} days`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      <form method="get" className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by client name"
          className="w-full max-w-xs rounded-[var(--radius-control)] border border-rule-strong bg-paper-lift px-3.5 py-2 text-[14px] text-graphite placeholder:text-grey-light focus:outline-none focus:border-graphite"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={`/app?${new URLSearchParams({ ...(q ? { q } : {}), status: s }).toString()}`}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                status === s ? "bg-graphite text-paper" : "bg-paper-soft text-graphite-soft hover:bg-rule"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </form>

      <div className="mt-6">
        {applications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[15px] text-grey">
              {q || status !== "all" ? "No applications match this filter." : "No applications yet."}
            </p>
            {!q && status === "all" && (
              <div className="mt-4">
                <ButtonLink href="/app/applications/new" size="sm">
                  Create your first application
                </ButtonLink>
              </div>
            )}
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-rule bg-paper-soft text-[12px] uppercase tracking-wide text-grey">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Loan amount</th>
                  <th className="px-5 py-3 font-medium">Purpose</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-rule last:border-0 hover:bg-paper-soft/60">
                    <td className="px-5 py-4">
                      <Link href={`/app/applications/${app.id}`} className="font-medium text-graphite hover:underline">
                        {app.client_name}
                      </Link>
                      {app.is_sample === 1 && (
                        <span className="ml-2 rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-medium text-amber">
                          Sample
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-graphite-soft">{formatMoneyCents(app.loan_amount_cents)}</td>
                    <td className="px-5 py-4 text-graphite-soft">{PURPOSE_LABEL[app.purpose]}</td>
                    <td className="px-5 py-4 text-graphite-soft">{app.location || "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-grey">
                      {new Date(app.updated_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
