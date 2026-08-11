import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";

/** Admins get unlimited use across every credit-gated tool, for testing —
 *  never blocked by balance, never actually charged. */
export function hasUnlimitedCredits(email: string | null | undefined): boolean {
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}

/** Sent to the client instead of the real (low, never-charged) stored balance
 * for unlimited accounts — the real number would trip low-credit warnings
 * that don't apply to them. */
export const UNLIMITED_CREDITS_DISPLAY = 999999;

// Credit balance/charging always goes through the service-role client, never
// the end-user session client. This is money-moving logic — it must not
// depend on RLS grants for the "authenticated" role, which silently broke at
// some point and caused every generation charge + transaction log to fail
// invisibly (confirmed via real prod data: 0 rows in credit_transactions
// despite 30+ charged generations, and a ~6-credit gap between credits
// actually deducted vs. credits that should have been charged).

export async function getUserCredits(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  return profile?.credits ?? 0;
}

/** Decrements credits via RPC and logs a transaction. Returns the new balance. */
export async function chargeCredits(
  userId: string,
  cost: number,
  currentCredits: number,
  description: string
): Promise<number> {
  const admin = createAdminClient();

  const { error: rpcError } = await admin.rpc("decrement_credits", { uid: userId, amount: cost });
  if (rpcError) console.error("decrement_credits failed:", rpcError.message);

  const { error: txError } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    type: "generation",
    description,
  });
  if (txError) console.error("credit_transactions insert failed:", txError.message);

  return rpcError ? currentCredits : Math.max(0, currentCredits - cost);
}

/** Adds credits back and logs a transaction. Returns the new balance. A plain
 * update, not an RPC — unlike chargeCredits' floor at zero, a refund has no
 * invariant to protect atomically, and after the decrement_credits RPC
 * exposure (it was anon-callable with no ownership check), the fix is fewer
 * RPC surfaces, not more. Used when an async job (image-to-video) is charged
 * up front, at submit time, but then fails on fal's side. */
export async function refundCredits(
  userId: string,
  amount: number,
  currentCredits: number,
  description: string
): Promise<number> {
  const admin = createAdminClient();
  const newBalance = currentCredits + amount;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (updateError) console.error("refundCredits update failed:", updateError.message);

  const { error: txError } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type: "refund",
    description,
  });
  if (txError) console.error("credit_transactions insert failed:", txError.message);

  return updateError ? currentCredits : newBalance;
}
