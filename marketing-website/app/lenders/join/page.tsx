import { redirect } from "next/navigation";

import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { FieldShell, Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createLenderPartnerAction } from "@/lib/actions/lenders";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Request lender access" };

export default async function LenderJoinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.account_status === "pending" ? "/lenders/pending" : "/app");
  const { error } = await searchParams;

  return (
    <AuthShell title="Join Mandate as a lender." subtitle="Tell us your appetite. We review each fund before enabling deal access." footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink>.</>}>
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}
      <form action={createLenderPartnerAction} className="mt-7 space-y-4">
        <FieldShell label="Your name"><Input name="name" autoComplete="name" required /></FieldShell>
        <FieldShell label="Fund or lender name"><Input name="firm_name" required /></FieldShell>
        <FieldShell label="Work email"><Input name="email" type="email" autoComplete="email" required /></FieldShell>
        <FieldShell label="Password"><Input name="password" type="password" autoComplete="new-password" minLength={8} required /></FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Minimum facility (NZD)"><Input name="min_loan" type="number" min="1" step="1000" required /></FieldShell>
          <FieldShell label="Maximum facility (NZD)"><Input name="max_loan" type="number" min="1" step="1000" required /></FieldShell>
        </div>
        <FieldShell label="Maximum LVR (%)"><Input name="max_lvr_pct" type="number" min="1" max="100" step="1" required /></FieldShell>
        <FieldShell label="Regions you lend in" hint="Comma separated, e.g. Auckland, Canterbury"><Input name="regions" placeholder="Nationwide" required /></FieldShell>
        <FieldShell label="Pre-sales appetite"><Select name="pre_sales_requirement" defaultValue="either"><option value="either">Flexible</option><option value="required">Required</option><option value="not_required">Not required</option></Select></FieldShell>
        <fieldset><legend className="mb-2 text-[13px] font-medium text-graphite-soft">Facility types</legend><div className="grid grid-cols-2 gap-2 text-[13px] text-graphite-soft">{[["development", "Development"], ["commercial_property", "Commercial property"], ["business_acquisition", "Business acquisition"], ["refinance", "Refinance"]].map(([value, label]) => <label key={value} className="flex gap-2"><input type="checkbox" name="loan_types" value={value} />{label}</label>)}</div></fieldset>
        <FieldShell label="Anything else advisers should know"><Textarea name="notes" rows={3} /></FieldShell>
        <p className="text-[12px] leading-relaxed text-grey">Your profile stays pending until reviewed. Deal information is never made available to your fund unless an adviser shares it with you.</p>
        <SubmitButton pendingLabel="Submitting request…" className="w-full">Request lender access</SubmitButton>
      </form>
    </AuthShell>
  );
}
