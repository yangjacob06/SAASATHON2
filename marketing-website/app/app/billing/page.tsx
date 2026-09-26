import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cancelPlanAction, startCheckoutAction } from "@/lib/actions/billing";
import { requireUser } from "@/lib/auth";
import { billing, PLANS, trialState } from "@/lib/billing";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; canceled?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { upgraded, canceled, error } = await searchParams;
  const trial = trialState(user);
  const provider = billing();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-graphite">Billing</h1>
      <p className="mt-1 text-[14px] text-grey">
        {provider.id === "stub"
          ? "Stripe isn't configured yet — plan changes below apply directly, as a stand-in for Stripe test mode."
          : "Subscriptions are processed by Stripe in test mode."}
      </p>

      {upgraded && (
        <div className="mt-6">
          <Alert tone="success">Your plan is active.</Alert>
        </div>
      )}
      {canceled && (
        <div className="mt-6">
          <Alert tone="info">Your subscription was canceled. You&rsquo;re back on the free trial.</Alert>
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card className="mt-8 p-6">
        <p className="text-[13px] uppercase tracking-wide text-grey">Current plan</p>
        <p className="mt-1 font-display text-2xl text-graphite">
          {user.subscription_status === "active" ? PLANS[user.plan as "starter" | "pro"]?.name : "Free trial"}
        </p>
        {trial.onTrial && (
          <p className="mt-1 text-[13.5px] text-grey">
            {trial.expired ? "Your trial has ended." : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} remaining.`}
          </p>
        )}
        {user.subscription_status === "active" && (
          <form action={cancelPlanAction} className="mt-4">
            <button type="submit" className="text-[13px] font-medium text-stop underline underline-offset-2">
              Cancel subscription
            </button>
          </form>
        )}
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = user.subscription_status === "active" && user.plan === plan.id;
          return (
            <Card key={plan.id} className={`p-7 ${isCurrent ? "border-graphite" : ""}`}>
              <h2 className="font-display text-xl text-graphite">{plan.name}</h2>
              <p className="mt-1 text-[13.5px] text-grey">{plan.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl text-graphite">${(plan.priceCents / 100).toFixed(0)}</span>
                <span className="text-[13px] text-grey">NZD / month</span>
              </p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13.5px] text-graphite-soft">
                    <span aria-hidden="true">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <p className="mt-6 text-[13px] font-medium text-go">Your current plan</p>
              ) : (
                <form action={startCheckoutAction} className="mt-6">
                  <input type="hidden" name="plan" value={plan.id} />
                  <SubmitButton pendingLabel="Redirecting…" className="w-full">
                    {user.subscription_status === "active" ? "Switch plan" : "Choose this plan"}
                  </SubmitButton>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
