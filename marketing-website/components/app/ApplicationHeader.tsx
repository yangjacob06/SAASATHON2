import Link from "next/link";

import { StatusBadge } from "@/components/app/StatusBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { advanceStatusAction } from "@/lib/actions/applications";
import { computeLvr, formatMoneyCents, PURPOSE_LABEL } from "@/lib/status";
import type { Application, ApplicationStatus } from "@/lib/types";

const NEXT_LABEL: Partial<Record<ApplicationStatus, string>> = {
  draft: "Mark summary ready",
  summary_ready: "Mark sent to lenders",
  sent_to_lenders: "Mark term sheet received",
  term_sheet_received: "Mark approved",
  approved: "Mark settled",
};

export function ApplicationHeader({ app }: { app: Application }) {
  const lvr = computeLvr(app.loan_amount_cents, app.property_value_cents);
  const nextLabel = NEXT_LABEL[app.status];

  return (
    <div>
      <Link href="/app" className="text-[13px] font-medium text-grey hover:text-graphite">
        ← Applications
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-graphite">{app.client_name}</h1>
            <StatusBadge status={app.status} />
            {app.is_sample === 1 && (
              <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-medium text-amber">Sample</span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-grey">
            {PURPOSE_LABEL[app.purpose]} · {app.location || "No location set"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {app.status !== "declined" && app.status !== "settled" && (
            <form action={advanceStatusAction}>
              <input type="hidden" name="application_id" value={app.id} />
              <input type="hidden" name="status" value="declined" />
              <button type="submit" className="rounded-[var(--radius-control)] border border-rule-strong px-3.5 py-2 text-[13px] font-medium text-grey hover:border-stop hover:text-stop">
                Mark declined
              </button>
            </form>
          )}
          {nextLabel && (
            <form action={advanceStatusAction}>
              <input type="hidden" name="application_id" value={app.id} />
              <SubmitButton pendingLabel="Updating…">{nextLabel}</SubmitButton>
            </form>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-card)] border border-rule bg-paper-lift p-6 text-[14px] sm:grid-cols-4">
        <div>
          <dt className="text-[11.5px] uppercase tracking-wide text-grey">Loan amount</dt>
          <dd className="mt-1 font-medium text-graphite">{formatMoneyCents(app.loan_amount_cents)}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] uppercase tracking-wide text-grey">Property value</dt>
          <dd className="mt-1 font-medium text-graphite">{formatMoneyCents(app.property_value_cents)}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] uppercase tracking-wide text-grey">LVR</dt>
          <dd className="mt-1 font-medium text-graphite">{lvr !== null ? `${lvr}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] uppercase tracking-wide text-grey">Loan term</dt>
          <dd className="mt-1 font-medium text-graphite">{app.loan_term_months ? `${app.loan_term_months} months` : "—"}</dd>
        </div>
        {app.pre_sales_pct !== null && (
          <div>
            <dt className="text-[11.5px] uppercase tracking-wide text-grey">Pre-sales</dt>
            <dd className="mt-1 font-medium text-graphite">{app.pre_sales_pct}%</dd>
          </div>
        )}
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-[11.5px] uppercase tracking-wide text-grey">Notes</dt>
          <dd className="mt-1 text-graphite-soft">{app.notes || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
