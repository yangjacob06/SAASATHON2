import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { confirmMockCheckoutAction } from "@/lib/actions/billing";
import { requireUser } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/billing";

export const metadata = { title: "Confirm plan" };

export default async function MockCheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  await requireUser();
  const { plan: planId } = await searchParams;
  const plan = planId ? PLANS[planId as PlanId] : undefined;
  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8 text-center">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-grey">Test mode</p>
        <h1 className="mt-2 font-display text-2xl text-graphite">Confirm your {plan.name} plan</h1>
        <p className="mt-3 text-[14px] text-grey">
          Stripe isn&rsquo;t configured in this environment, so this stands in for the real
          checkout page. In production this screen is Stripe Checkout in test mode — set
          <code className="mx-1 rounded bg-paper-soft px-1.5 py-0.5 text-[12px]">STRIPE_SECRET_KEY</code>
          to enable it.
        </p>
        <p className="mt-4 font-display text-3xl text-graphite">
          ${(plan.priceCents / 100).toFixed(0)} <span className="text-sm text-grey">NZD / month</span>
        </p>

        <form action={confirmMockCheckoutAction} className="mt-6">
          <input type="hidden" name="plan" value={plan.id} />
          <SubmitButton pendingLabel="Activating…" className="w-full">
            Confirm and activate
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
