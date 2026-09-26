import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FieldShell, Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createApplicationAction } from "@/lib/actions/applications";
import { NZ_REGIONS, PURPOSE_LABEL } from "@/lib/status";

export const metadata = { title: "New application" };

export default async function NewApplicationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-graphite">New application</h1>
      <p className="mt-1 text-[14px] text-grey">
        Enter what you have — you can generate the deal summary and upload more documents afterwards.
      </p>

      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card className="mt-8 p-8">
        <form action={createApplicationAction} className="space-y-6">
          <FieldShell label="Client name" required>
            <Input name="client_name" type="text" required placeholder="e.g. Rangiora Terraces Ltd" />
          </FieldShell>

          <div className="grid grid-cols-2 gap-4">
            <FieldShell label="Loan amount (NZD)" required>
              <Input name="loan_amount" type="number" min="0" step="1000" required placeholder="8000000" />
            </FieldShell>
            <FieldShell label="Purpose" required>
              <Select name="purpose" defaultValue="commercial_property" required>
                {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldShell>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldShell label="Region" required>
              <Select name="region" defaultValue="" required>
                <option value="" disabled>
                  Select a region
                </option>
                {NZ_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FieldShell>
            <FieldShell label="Town / suburb" hint="optional">
              <Input name="suburb" type="text" placeholder="e.g. Rangiora" />
            </FieldShell>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldShell label="Property / business value (NZD)" hint="optional">
              <Input name="property_value" type="number" min="0" step="1000" placeholder="12500000" />
            </FieldShell>
            <FieldShell label="Loan term (months)" hint="optional">
              <Input name="loan_term_months" type="number" min="1" placeholder="18" />
            </FieldShell>
          </div>

          <FieldShell label="Pre-sales (%)" hint="for development applications">
            <Input name="pre_sales_pct" type="number" min="0" max="100" placeholder="30" />
          </FieldShell>

          <FieldShell label="Notes" hint="optional">
            <Textarea name="notes" rows={4} placeholder="Repayment plan, exit strategy, anything a lender should know upfront." />
          </FieldShell>

          <FieldShell label="Supporting documents" hint="valuation, feasibility, financials — PDF">
            <input
              name="documents"
              type="file"
              accept="application/pdf"
              multiple
              className="block w-full rounded-[var(--radius-control)] border border-dashed border-rule-strong bg-paper-soft px-3.5 py-6 text-[13px] text-grey file:mr-4 file:rounded-[4px] file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-paper"
            />
          </FieldShell>

          <SubmitButton pendingLabel="Creating…" className="w-full">
            Create application
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
