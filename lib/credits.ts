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

/**
 * Atomically charges `cost` credits. Returns the new balance, or **null** when
 * the user could not afford it (or the profile is missing) — callers must
 * treat null as "nothing was charged, reject the request", normally with a 402.
 *
 * The guard and the decrement happen inside one SQL statement (see the
 * charge_credits function). That matters because the old shape — read the
 * balance in one query, decide, then decrement in another — left a window as
 * wide as a whole AI generation between the check and the charge: two
 * concurrent requests both saw a sufficient balance, both generated, and the
 * decrement floored at zero rather than failing, so the second generation was
 * effectively free. Reading the balance first is now only useful for showing
 * a friendly "out of credits" message *before* doing expensive work; this
 * call is what actually enforces it.
 */
export async function chargeCredits(
  userId: string,
  cost: number,
  description: string
): Promise<number | null> {
  const admin = createAdminClient();

  const { data: newBalance, error: rpcError } = await admin.rpc("charge_credits", {
    uid: userId,
    amount: cost,
  });
  if (rpcError) {
    console.error("charge_credits failed:", rpcError.message);
    return null;
  }
  // NULL from the function means the WHERE guard (credits >= amount) matched
  // no row — insufficient balance. Nothing was deducted.
  if (newBalance === null || newBalance === undefined) return null;

  const { error: txError } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    type: "generation",
    description,
  });
  if (txError) console.error("credit_transactions insert failed:", txError.message);

  return newBalance as number;
}

/**
 * Adds credits back and logs a transaction. Returns the new balance, or null
 * if the refund itself failed.
 *
 * Increments in place via SQL rather than writing back a balance read earlier
 * in the request: the read-modify-write version silently discarded any charge
 * that landed in between (a user starting a new generation while an older one
 * was being refunded would have had that charge erased).
 *
 * Callers are responsible for making sure a given generation is only refunded
 * once — see markRowRefunded in lib/video-status.ts, which claims the row's
 * terminal state before any refund is issued.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string
): Promise<number | null> {
  const admin = createAdminClient();

  const { data: newBalance, error: rpcError } = await admin.rpc("refund_credits", {
    uid: userId,
    amount,
  });
  if (rpcError) {
    console.error("refund_credits failed:", rpcError.message);
    return null;
  }

  const { error: txError } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type: "refund",
    description,
  });
  if (txError) console.error("credit_transactions insert failed:", txError.message);

  return (newBalance ?? null) as number | null;
}
