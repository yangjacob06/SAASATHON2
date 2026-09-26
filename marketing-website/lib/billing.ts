/**
 * Subscriptions.
 *
 * Every adviser starts on a 14-day free trial with no card. Stripe is behind
 * the `BillingProvider` interface below: with no STRIPE_SECRET_KEY set the app
 * uses `stubBilling`, which flips the plan locally so the whole flow is
 * demoable; set the key and `stripeBilling` takes over with no changes at the
 * call sites.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { run } from "./db";
import { TRIAL_DAYS } from "./auth";
import type { User } from "./types";

export type PlanId = "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceCents: number;
  activeApplicationLimit: number | null;
  blurb: string;
  features: string[];
  stripePriceId: string | undefined;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 4900,
    activeApplicationLimit: 5,
    blurb: "For advisers placing the occasional private-credit deal.",
    features: [
      "Up to 5 active applications",
      "AI deal summaries",
      "Ranked non-bank lender matching",
      "Progress tracking and reminders",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 14900,
    activeApplicationLimit: null,
    blurb: "For advisers running a full private-credit pipeline.",
    features: [
      "Unlimited active applications",
      "Unlimited AI deal summaries",
      "PDF export with your firm's logo",
      "Ranked non-bank lender matching",
      "Progress tracking and reminders",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
};

export function planFor(user: Pick<User, "plan">): Plan | null {
  return PLANS[user.plan as PlanId] ?? null;
}

export interface TrialState {
  onTrial: boolean;
  daysLeft: number;
  expired: boolean;
  /** True when the adviser may keep using the app right now. */
  active: boolean;
}

export function trialState(user: User): TrialState {
  const paid = user.subscription_status === "active";
  if (paid) return { onTrial: false, daysLeft: 0, expired: false, active: true };

  const ends = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : 0;
  const msLeft = ends - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));

  return {
    onTrial: true,
    daysLeft,
    expired: msLeft <= 0,
    active: msLeft > 0,
  };
}

/** null = unlimited. On trial, use the Pro limit so the trial is worth trying. */
export function activeApplicationLimit(user: User): number | null {
  const plan = planFor(user);
  if (user.subscription_status === "active") return plan?.activeApplicationLimit ?? null;
  return PLANS.pro.activeApplicationLimit;
}

/* -------------------------------------------------------------------------- */
/* Provider interface                                                          */
/* -------------------------------------------------------------------------- */

export interface CheckoutRequest {
  user: User;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingProvider {
  readonly id: "stub" | "stripe";
  createCheckout(req: CheckoutRequest): Promise<{ url: string }>;
  verifyWebhook(rawBody: string, signature: string | null): Promise<BillingEvent | null>;
}

export interface BillingEvent {
  type: string;
  userId: string | null;
  plan: PlanId | null;
  customerId: string | null;
  subscriptionId: string | null;
  status: string | null;
}

/* -------------------------------------------------------------------------- */
/* Stub provider (default)                                                     */
/* -------------------------------------------------------------------------- */

const stubBilling: BillingProvider = {
  id: "stub",
  async createCheckout({ plan, user }) {
    return { url: `/app/billing/mock-checkout?plan=${plan.id}&user=${user.id}` };
  },
  async verifyWebhook() {
    return null;
  },
};

/* -------------------------------------------------------------------------- */
/* Stripe provider                                                             */
/* -------------------------------------------------------------------------- */

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest(path: string, form: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Stripe request failed");
  return json;
}

const stripeBilling: BillingProvider = {
  id: "stripe",

  async createCheckout({ user, plan, successUrl, cancelUrl }) {
    if (!plan.stripePriceId) {
      throw new Error(
        `No Stripe price configured for the ${plan.name} plan (set STRIPE_PRICE_${plan.id.toUpperCase()}).`,
      );
    }
    const session = await stripeRequest("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": plan.stripePriceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      client_reference_id: user.id,
      "metadata[user_id]": user.id,
      "metadata[plan]": plan.id,
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][plan]": plan.id,
      "subscription_data[trial_period_days]": String(TRIAL_DAYS),
    });
    return { url: session.url as string };
  },

  async verifyWebhook(rawBody, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) return null;

    const parts = Object.fromEntries(
      signature.split(",").map((pair) => pair.split("=") as [string, string]),
    );
    if (!parts.t || !parts.v1) return null;

    const expected = createHmac("sha256", secret)
      .update(`${parts.t}.${rawBody}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(parts.v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const event = JSON.parse(rawBody);
    const object = event?.data?.object ?? {};
    const metadata = object.metadata ?? {};

    return {
      type: event.type,
      userId: metadata.user_id ?? object.client_reference_id ?? null,
      plan: (metadata.plan as PlanId) ?? null,
      customerId: typeof object.customer === "string" ? object.customer : null,
      subscriptionId:
        typeof object.subscription === "string"
          ? object.subscription
          : object.object === "subscription"
            ? object.id
            : null,
      status: object.status ?? null,
    };
  },
};

export function billing(): BillingProvider {
  return process.env.STRIPE_SECRET_KEY ? stripeBilling : stubBilling;
}

/* -------------------------------------------------------------------------- */

export async function activateSubscription(params: {
  userId: string;
  plan: PlanId;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<void> {
  await run(
    `UPDATE users
        SET plan = $1,
            subscription_status = 'active',
            stripe_customer_id = COALESCE($2, stripe_customer_id),
            stripe_subscription_id = COALESCE($3, stripe_subscription_id)
      WHERE id = $4`,
    [params.plan, params.customerId ?? null, params.subscriptionId ?? null, params.userId],
  );
}

export async function cancelSubscription(userId: string): Promise<void> {
  await run(
    `UPDATE users SET plan = 'trial', subscription_status = 'canceled' WHERE id = $1`,
    [userId],
  );
}
