import { Card } from "@/components/ui/Card";
import { query } from "@/lib/db";
import { formatMoneyCents, PURPOSE_LABEL } from "@/lib/status";
import type { Lender } from "@/lib/types";

export const metadata = { title: "Lender directory" };

const PRE_SALES_LABEL: Record<string, string> = {
  required: "Pre-sales required",
  not_required: "No pre-sales required",
  either: "Flexible on pre-sales",
};

export default async function LendersPage() {
  const rows = await query<Lender & { regions: string; loan_types: string }>(`SELECT * FROM lenders ORDER BY name`);
  const lenders: Lender[] = rows.map((l) => ({
    ...l,
    regions: JSON.parse(l.regions as unknown as string),
    loan_types: JSON.parse(l.loan_types as unknown as string),
  }));

  return (
    <div>
      <h1 className="font-display text-3xl text-graphite">Lender directory</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-grey">
        The non-bank lenders Mandate matches your applications against. Matching happens
        automatically from each application&rsquo;s page — this is the full directory for reference.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {lenders.map((l) => (
          <Card key={l.id} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium text-graphite">{l.name}</h2>
              <span className="shrink-0 text-[11.5px] text-grey">max {l.max_lvr_pct}% LVR</span>
            </div>
            <p className="mt-1 text-[13px] text-grey">{formatMoneyCents(l.min_loan_cents)}–{formatMoneyCents(l.max_loan_cents)}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {l.loan_types.map((t) => (
                <span key={t} className="rounded-full bg-paper-soft px-2 py-0.5 text-[11px] text-graphite-soft">
                  {PURPOSE_LABEL[t]}
                </span>
              ))}
            </div>

            <p className="mt-3 text-[13px] text-graphite-soft">{l.regions.join(", ")}</p>
            <p className="mt-1 text-[12.5px] text-grey">{PRE_SALES_LABEL[l.pre_sales_requirement]}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-grey">{l.notes}</p>
            <p className="mt-3 text-[12.5px] text-graphite-soft">{l.contact_email}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
