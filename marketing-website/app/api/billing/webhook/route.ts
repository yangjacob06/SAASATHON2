import { NextResponse } from "next/server";

import { activateSubscription, billing, cancelSubscription } from "@/lib/billing";

/** Stripe webhook. Only reachable when STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET are set — see lib/billing.ts. */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const event = await billing().verifyWebhook(rawBody, signature);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  if (!event.userId) return NextResponse.json({ received: true });

  if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated") {
    if (event.status === "active" || event.status === "trialing") {
      await activateSubscription({
        userId: event.userId,
        plan: event.plan ?? "starter",
        customerId: event.customerId,
        subscriptionId: event.subscriptionId,
      });
    } else if (event.status === "canceled" || event.status === "unpaid") {
      await cancelSubscription(event.userId);
    }
  } else if (event.type === "customer.subscription.deleted") {
    await cancelSubscription(event.userId);
  }

  return NextResponse.json({ received: true });
}
