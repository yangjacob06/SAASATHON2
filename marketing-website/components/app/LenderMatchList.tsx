import { Card } from "@/components/ui/Card";
import { refreshLenderMatchesAction, setLenderStageAction } from "@/lib/actions/applications";
import { formatMoneyCents } from "@/lib/status";
import type { ApplicationLenderRow } from "@/lib/lenders";
import type { LenderStage } from "@/lib/types";

const STAGE_LABEL: Record<LenderStage, string> = {
  matched: "Matched",
  contacted: "Contacted",
  interested: "Interested",
  declined: "Declined",
};

const STAGE_ORDER: LenderStage[] = ["matched", "contacted", "interested", "declined"];

const STAGE_CLASS: Record<LenderStage, string> = {
  matched: "bg-paper-soft text-graphite-soft",
  contacted: "bg-sky-soft text-sky",
  interested: "bg-go-soft text-go",
  declined: "bg-stop-soft text-stop",
};

export function LenderMatchList({ applicationId, matches }: { applicationId: string; matches: ApplicationLenderRow[] }) {
  return (
    <Card className="p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-graphite">Possible lenders</h2>
          <p className="mt-1 text-[13px] text-grey">Ranked by fit against loan size, region, LVR and pre-sales.</p>
        </div>
        <form action={refreshLenderMatchesAction}>
          <input type="hidden" name="application_id" value={applicationId} />
          <button
            type="submit"
            className="shrink-0 rounded-[var(--radius-control)] border border-rule-strong px-3 py-1.5 text-[12.5px] font-medium text-graphite-soft hover:border-graphite"
          >
            Re-match
          </button>
        </form>
      </div>

      {matches.length === 0 ? (
        <p className="mt-6 text-[14px] text-grey">
          No lenders matched yet. Generate the deal summary first, or click &ldquo;Re-match&rdquo; once the
          application details are complete.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {matches.map((m) => (
            <li key={m.id} className="rounded-[var(--radius-card)] border border-rule p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-graphite">{m.lender.name}</p>
                  <p className="text-[12.5px] text-grey">
                    {formatMoneyCents(m.lender.min_loan_cents)}–{formatMoneyCents(m.lender.max_loan_cents)} ·
                    {" "}max {m.lender.max_lvr_pct}% LVR · {m.lender.contact_email}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STAGE_CLASS[m.stage]}`}>
                  {STAGE_LABEL[m.stage]}
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {m.match_reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] text-graphite-soft">
                    <span className="text-go">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STAGE_ORDER.filter((s) => s !== m.stage).map((s) => (
                  <form key={s} action={setLenderStageAction}>
                    <input type="hidden" name="application_id" value={applicationId} />
                    <input type="hidden" name="application_lender_id" value={m.id} />
                    <input type="hidden" name="stage" value={s} />
                    <button
                      type="submit"
                      className="rounded-full border border-rule-strong px-2.5 py-1 text-[11.5px] font-medium text-grey hover:border-graphite hover:text-graphite"
                    >
                      Mark {STAGE_LABEL[s]}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
