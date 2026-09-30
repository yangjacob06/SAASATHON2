import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FieldShell, Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateLenderCriteriaAction } from "@/lib/actions/lenders";
import { requireLender } from "@/lib/auth";
import { one } from "@/lib/db";
import type { Lender } from "@/lib/types";

export const metadata = { title: "Lending criteria" };

export default async function LenderCriteriaPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireLender();
  const lender = await one<Lender & { regions: string; loan_types: string }>(`SELECT * FROM lenders WHERE id = $1 AND owner_user_id = $2`, [user.lender_id, user.id]);
  if (!lender) redirect("/app");
  const { saved, error } = await searchParams;
  const regions: string[] = JSON.parse(lender.regions as unknown as string);
  const loanTypes: string[] = JSON.parse(lender.loan_types as unknown as string);
  const choices = [["development", "Development"], ["commercial_property", "Commercial property"], ["business_acquisition", "Business acquisition"], ["refinance", "Refinance"]];

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Your fund profile</p><h1 className="mt-3 font-display text-3xl text-graphite">Lending criteria</h1>
      <p className="mt-2 text-[14px] text-grey">Keep your mandate current so advisers can assess fit. Updates affect future matches; they do not remove deals already shared with you.</p>
      {saved && <div className="mt-5"><Alert tone="success">Your lending criteria have been updated.</Alert></div>}
      {error && <div className="mt-5"><Alert tone="error">{error}</Alert></div>}
      <Card className="mt-7 p-7">
        <form action={updateLenderCriteriaAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="Minimum facility (NZD)"><Input name="min_loan" type="number" min="1" step="1000" defaultValue={lender.min_loan_cents / 100} required /></FieldShell>
            <FieldShell label="Maximum facility (NZD)"><Input name="max_loan" type="number" min="1" step="1000" defaultValue={lender.max_loan_cents / 100} required /></FieldShell>
          </div>
          <FieldShell label="Maximum LVR (%)"><Input name="max_lvr_pct" type="number" min="1" max="100" step="1" defaultValue={lender.max_lvr_pct} required /></FieldShell>
          <FieldShell label="Regions" hint="Comma separated"><Input name="regions" defaultValue={regions.join(", ")} required /></FieldShell>
          <FieldShell label="Pre-sales appetite"><Select name="pre_sales_requirement" defaultValue={lender.pre_sales_requirement}><option value="either">Flexible</option><option value="required">Required</option><option value="not_required">Not required</option></Select></FieldShell>
          <fieldset><legend className="mb-2 text-[13px] font-medium text-graphite-soft">Facility types</legend><div className="grid grid-cols-2 gap-2 text-[13px] text-graphite-soft">{choices.map(([value, label]) => <label key={value} className="flex gap-2"><input type="checkbox" name="loan_types" value={value} defaultChecked={loanTypes.includes(value)} />{label}</label>)}</div></fieldset>
          <FieldShell label="Notes for advisers"><Textarea name="notes" rows={4} defaultValue={lender.notes} /></FieldShell>
          <SubmitButton pendingLabel="Saving criteria…">Save criteria</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
