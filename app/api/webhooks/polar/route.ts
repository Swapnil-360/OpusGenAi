import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import {
  recordWebhookEvent,
  markWebhookProcessed,
  syncSubscription,
  renewSubscriptionCredits,
  cancelSubscription,
} from "@/lib/billing";
import { resolvePlanFromProductId } from "@/lib/polar";
import { createAdminClient } from "@/lib/supabase/admin";
import { type SubscriptionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;

  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not configured in environment.");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(rawBody, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("Polar webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 403 },
      );
    }
    console.error("Polar webhook verification error:", err);
    return NextResponse.json(
      { error: "Webhook verification failed." },
      { status: 400 },
    );
  }

  // Polar webhook events contain an event id or timestamp-based identification
  const eventId =
    (headers["webhook-id"] as string) ||
    `${event.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Idempotency check: avoid double crediting on retries
  const { isDuplicate } = await recordWebhookEvent(
    eventId,
    event.type,
    "polar",
    event,
  );

  if (isDuplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const admin = createAdminClient();

    // Helper to resolve user ID from externalId, metadata, or customer email
    async function resolveUserId(
      externalId?: string | null,
      metadata?: Record<string, unknown> | null,
      customerEmail?: string | null,
    ): Promise<string | null> {
      if (externalId) return externalId;
      if (metadata && typeof metadata.userId === "string") return metadata.userId;

      if (customerEmail) {
        // Fallback: match by email in auth.users or profiles
        const { data: userProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .single();
        if (userProfile) return userProfile.id;
      }
      return null;
    }

    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated": {
        const sub = event.data;
        const metadata = (sub.metadata as Record<string, unknown>) ?? {};
        const customer = sub.customer;

        const userId = await resolveUserId(
          customer.externalId,
          metadata,
          customer.email,
        );

        if (!userId) {
          console.warn(
            `Polar ${event.type}: could not resolve user for subscription ${sub.id}`,
          );
          break;
        }

        const plan =
          resolvePlanFromProductId(sub.productId) ??
          ((metadata.plan as "basic" | "pro") || "free");

        // Map Polar subscription status to our internal SubscriptionStatus
        let status: SubscriptionStatus = "none";
        if (sub.status === "active") status = "active";
        else if (sub.status === "past_due") status = "past_due";
        else if (sub.status === "canceled") status = "canceled";
        else if (sub.status === "unpaid") status = "unpaid";
        else if (sub.status === "incomplete") status = "incomplete";
        else if (sub.status === "trialing") status = "trialing";

        const currentPeriodStart = sub.currentPeriodStart
          ? new Date(sub.currentPeriodStart).toISOString()
          : new Date().toISOString();

        const currentPeriodEnd = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toISOString()
          : null;

        await syncSubscription({
          userId,
          customerId: sub.customerId,
          subscriptionId: sub.id,
          status,
          plan,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
        });

        // If newly created or active and user is on a paid plan, grant initial subscription credits
        if (event.type === "subscription.created" && plan !== "free") {
          await renewSubscriptionCredits(
            userId,
            plan,
            currentPeriodStart,
            currentPeriodEnd ?? undefined,
          );
        }
        break;
      }

      case "order.created":
      case "order.paid": {
        const order = event.data;
        // If order has a subscription_id and billing_reason is renewal/subscription_cycle
        const subId = order.subscriptionId;
        if (subId) {
          const customer = order.customer;
          const metadata = (order.metadata as Record<string, unknown>) ?? {};
          const userId = await resolveUserId(
            customer?.externalId,
            metadata,
            customer?.email,
          );

          if (userId && order.productId) {
            const plan = resolvePlanFromProductId(order.productId);
            if (plan && plan !== "free") {
              await renewSubscriptionCredits(userId, plan);
            }
          }
        }
        break;
      }

      case "subscription.canceled": {
        const sub = event.data;
        const metadata = (sub.metadata as Record<string, unknown>) ?? {};
        const userId = await resolveUserId(
          sub.customer.externalId,
          metadata,
          sub.customer.email,
        );

        if (userId) {
          await cancelSubscription(userId, sub.cancelAtPeriodEnd ?? false);
        }
        break;
      }

      case "subscription.revoked": {
        const sub = event.data;
        const metadata = (sub.metadata as Record<string, unknown>) ?? {};
        const userId = await resolveUserId(
          sub.customer.externalId,
          metadata,
          sub.customer.email,
        );

        if (userId) {
          await cancelSubscription(userId, false);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    await markWebhookProcessed(eventId, "processed");
    return NextResponse.json({ received: true });
  } catch (processError: unknown) {
    const message =
      processError instanceof Error ? processError.message : "Processing error";
    console.error(`Error processing Polar webhook event ${eventId}:`, processError);
    await markWebhookProcessed(eventId, "failed", message);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
