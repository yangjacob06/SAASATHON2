"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "../auth";
import { activateSubscription, billing, cancelSubscription, PLANS, type PlanId } from "../billing";

const APP_URL = process.env.APP_URL || "http://localhost:3310";

export async function startCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("plan") || "starter") as PlanId;
  const plan = PLANS[planId];
  if (!plan) redirect("/app/billing?error=Unknown+plan");

  const { url } = await billing().createCheckout({
    user,
    plan,
    successUrl: `${APP_URL}/app/billing?upgraded=1`,
    cancelUrl: `${APP_URL}/app/billing`,
  });

  redirect(url);
}

/** The stub provider's confirmation step — activates the plan directly, no Stripe involved. */
export async function confirmMockCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("plan") || "starter") as PlanId;
  if (!PLANS[planId]) redirect("/app/billing");

  await activateSubscription({ userId: user.id, plan: planId });
  revalidatePath("/app", "layout");
  redirect("/app/billing?upgraded=1");
}

export async function cancelPlanAction() {
  const user = await requireUser();
  await cancelSubscription(user.id);
  revalidatePath("/app", "layout");
  redirect("/app/billing?canceled=1");
}
