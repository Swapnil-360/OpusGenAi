import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { type SubscriptionStatus } from "@/types/database";

export interface RecordWebhookResult {
  isDuplicate: boolean;
  error?: string;
}

/**
 * Checks and records an incoming payment gateway webhook event to guarantee idempotency.
 * If the event was already received/processed, returns `{ isDuplicate: true }` so
 * webhook handlers can return 200 without double-crediting or re-applying side effects.
 */
export async function recordWebhookEvent(
  eventId: string,
  gateway: string,
  eventType: string,
  payload?: unknown,
): Promise<RecordWebhookResult> {
  const admin = createAdminClient();

  const { error } = await admin.from("webhook_events").insert({
    event_id: eventId,
    gateway,
    event_type: eventType,
    payload: payload as import("@/types/database").Json,
    status: "processing",
  });

  if (error) {
    // Postgres code 23505 = unique_violation
    if (error.code === "23505") {
      return { isDuplicate: true };
    }
    console.error("Failed to record webhook event:", error.message);
    return { isDuplicate: false, error: error.message };
  }

  return { isDuplicate: false };
}

/**
 * Finalizes the webhook event state once processing finishes or fails.
 */
export async function markWebhookProcessed(
  eventId: string,
  status: "processed" | "failed",
  errorMessage?: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to mark webhook event processed:", error.message);
  }
}

export interface SyncSubscriptionParams {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  plan: Plan;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Updates a user's subscription metadata and tier on profiles.
 * Always executed using the service-role client.
 */
export async function syncSubscription({
  userId,
  customerId,
  subscriptionId,
  status,
  plan,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
}: SyncSubscriptionParams): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: status,
      plan,
      current_period_start: currentPeriodStart || new Date().toISOString(),
      current_period_end: currentPeriodEnd || null,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to sync subscription on profiles:", error.message);
    return false;
  }

  return true;
}

/**
 * Allots monthly subscription credits and resets the billing cycle bounds.
 * Uses atomic credit granting (stacking on top of existing balance) and logs
 * a "subscription_renewal" ledger transaction.
 */
export async function renewSubscriptionCredits(
  userId: string,
  plan: Plan,
  cycleStart?: string,
  cycleEnd?: string,
): Promise<number | null> {
  if (plan === "free") return null;

  const planInfo = PLAN_LIMITS[plan];
  if (!planInfo || planInfo.credits <= 0) return null;

  const newBalance = await grantCredits(
    userId,
    planInfo.credits,
    "subscription_renewal",
    `${planInfo.name} plan monthly credit refill (+${planInfo.credits} credits)`,
  );

  if (newBalance === null) {
    console.error(
      `Failed to grant renewal credits for user ${userId} on plan ${plan}`,
    );
    return null;
  }

  // Update billing cycle period bounds on profile
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      current_period_start: cycleStart || new Date().toISOString(),
      current_period_end: cycleEnd || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return newBalance;
}

/**
 * Cancels a subscription. If `cancelAtPeriodEnd` is true, keeps plan active
 * until current_period_end. If false (immediate cancellation), downgrades to free.
 */
export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean,
): Promise<boolean> {
  const admin = createAdminClient();

  if (cancelAtPeriodEnd) {
    const { error } = await admin
      .from("profiles")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return !error;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !error;
}
