import { Card } from "@/components/ui/Card";
import { formatMoneyCents } from "@/lib/status";
import type { Application } from "@/lib/types";
import type { ApplicationDocument } from "@/lib/types";
import { analyzeSyntheticApplication, type SyntheticSourceReviewRow } from "@/lib/synthetic/engine";

function ReviewState({ state }: { state: SyntheticSourceReviewRow["state"] }) {
  const styles = {
    aligned: "bg-go-soft text-go",
    conflict: "bg-stop-soft text-stop",
    review: "bg-amber-soft text-amber",
  };
  const labels = { aligned: "Aligned", conflict: "Conflict to check", review: "Confirm value" };
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10.5px] font-medium ${styles[state]}`}>{labels[state]}</span>;
}

export function SyntheticReviewPanel({
  app,
  documents,
  rows,
}: {
  app: Application;
  documents: ApplicationDocument[];
  rows: SyntheticSourceReviewRow[];
}) {
  const analysis = analyzeSyntheticApplication(app, documents);

  return (
    <section className="space-y-5" aria-labelledby="source-review-heading">
      <div>
        <h2 id="source-review-heading" className="font-display text-xl text-graphite">Source review & funding options</h2>
        <p className="mt-1 text-[12.5px] text-grey">Check uploaded values against the deal form before using the lender matches.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h3 className="text-[14px] font-semibold text-graphite">Review extracted data</h3>
          <p className="mt-1 text-[11.5px] text-grey">Conflicts are flagged for you to resolve; Mandate does not silently choose between sources.</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-grey">
            Upload the deal folder or the synthetic CSV examples to compare source fields with the application. PDFs can be included in the summary, while structured field matching currently reads CSV files.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-rule bg-paper-soft text-[10.5px] uppercase tracking-wide text-grey">
                  <th className="px-5 py-3 font-medium">Data point</th>
                  <th className="px-5 py-3 font-medium">Deal form</th>
                  <th className="px-5 py-3 font-medium">Uploaded source</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.field} className="border-b border-rule last:border-0 align-top">
                    <td className="px-5 py-3 font-medium text-graphite">{row.label}</td>
                    <td className="px-5 py-3 text-graphite-soft">{row.formValue || "Not entered"}</td>
                    <td className="px-5 py-3 text-graphite-soft">
                      <ul className="space-y-1">
                        {row.sources.map((source, index) => (
                          <li key={`${source.filename}-${index}`}><span className="text-grey">{source.filename}:</span> {source.value}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-3"><ReviewState state={row.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {analysis && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-graphite">Synthetic lender criteria checks</h3>
                <p className="mt-1 text-[11.5px] text-grey">Fictional demo criteria only. The criteria match percentages above use the workspace lender directory.</p>
              </div>
              <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[10.5px] font-medium text-amber">Demo data</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {analysis.lenderComparisons.map((comparison) => (
                <div key={comparison.lenderName} className="rounded-[var(--radius-control)] border border-rule p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-graphite">{comparison.lenderName}</p>
                    <span className="text-[10.5px] font-medium text-graphite-soft">{comparison.overall.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-grey">{comparison.explanation}</p>
                  <ul className="mt-3 space-y-1.5">
                    {comparison.checks.map((check) => (
                      <li key={check.criterion} className="text-[11px] text-graphite-soft">
                        <span className="font-medium">{check.criterion}:</span> {check.outcome.replaceAll("_", " ")} — {check.explanation}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-graphite">Possible funding splits</h3>
                <p className="mt-1 text-[11.5px] text-grey">Up to three ways to cover the request using the demo provider limits. These are exploratory allocations, not offers.</p>
              </div>
              <span className="text-[11px] text-grey">Requested term: {analysis.termMonths} months</span>
            </div>

            {analysis.fundingSearch.alternatives.length === 0 ? (
              <div className="mt-4 rounded-[var(--radius-control)] bg-paper-soft p-4">
                <p className="text-[13px] font-medium text-graphite">No complete package found</p>
                <p className="mt-1 text-[12px] text-grey">{analysis.fundingSearch.message}</p>
                {analysis.fundingSearch.shortfall_cents > 0 && <p className="mt-1 text-[12px] text-grey">Recorded limits leave {formatMoneyCents(analysis.fundingSearch.shortfall_cents)} uncovered.</p>}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {analysis.fundingSearch.alternatives.slice(0, 3).map((option, index) => {
                  const title = option.provider_count === 1 ? "Single-provider option" : option.provider_count === 2 ? "Balanced split" : "Broader coverage";
                  return (
                    <article key={`${index}-${option.allocations.map((item) => item.provider_name).join("-")}`} className="rounded-[var(--radius-control)] border border-rule p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-grey">Option {index + 1}</p>
                      <h4 className="mt-1 text-[14px] font-semibold text-graphite">{title}</h4>
                      <p className="mt-1 font-display text-xl text-graphite">{formatMoneyCents(option.total_cents)}</p>
                      <p className="text-[11px] text-grey">Across {option.provider_count} fictional provider{option.provider_count === 1 ? "" : "s"}</p>
                      <ul className="mt-3 space-y-2 border-t border-rule pt-3">
                        {option.allocations.map((allocation) => (
                          <li key={`${allocation.provider_name}-${allocation.facility_name}`} className="flex justify-between gap-2 text-[11.5px]">
                            <span className="text-graphite-soft">{allocation.provider_name}</span>
                            <span className="shrink-0 font-medium text-graphite">{formatMoneyCents(allocation.amount_cents)}</span>
                          </li>
                        ))}
                      </ul>
                      {option.warnings.length > 0 && <p className="mt-3 text-[10.5px] leading-relaxed text-amber">Check: {option.warnings.join("; ")}</p>}
                      <p className="mt-3 text-[10.5px] leading-relaxed text-grey">Interest rates, fees and final conditions are not supplied by the demo data.</p>
                    </article>
                  );
                })}
              </div>
            )}

            {analysis.fundingSearch.exclusions.length > 0 && (
              <details className="mt-4 border-t border-rule pt-3">
                <summary className="cursor-pointer text-[12px] font-medium text-graphite-soft">Why other providers were excluded ({analysis.fundingSearch.exclusions.length})</summary>
                <ul className="mt-2 space-y-1.5 text-[11.5px] text-grey">
                  {analysis.fundingSearch.exclusions.map((item, index) => (
                    <li key={`${item.provider}-${item.facility ?? ""}-${index}`}><span className="font-medium text-graphite-soft">{item.provider}{item.facility ? ` · ${item.facility}` : ""}:</span> {item.reason}</li>
                  ))}
                </ul>
              </details>
            )}
            <p className="mt-4 text-[10.5px] leading-relaxed text-grey">{analysis.disclaimer}</p>
          </Card>
        </>
      )}
    </section>
  );
}
