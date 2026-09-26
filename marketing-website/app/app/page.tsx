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
          <h1 className="font-display text-3xl text-graphite">Applications</h1>
          <p className="mt-1 text-[14px] text-grey">
            {activeCount} active{limit !== null ? ` of ${limit}` : ""}
            {plan ? ` on the ${plan.name} plan` : " on your free trial"}.
          </p>
        </div>
        <ButtonLink href="/app/applications/new">New application</ButtonLink>
      </div>

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
