import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";

/** Admins get unlimited use across every credit-gated tool, for testing —
 *  never blocked by balance, never actually charged. */
export function hasUnlimitedCredits(email: string | null | undefined): boolean {
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}

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
