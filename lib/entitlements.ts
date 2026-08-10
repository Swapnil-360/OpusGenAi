import { createAdminClient } from "@/lib/supabase/admin";
import { type Plan } from "@/lib/plans";

// Always the service-role client, same reasoning as lib/credits.ts: plan is
// part of the money/entitlement surface and must never depend on an RLS
// grant for the "authenticated" role.

export async function getUserPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  return (profile?.plan as Plan) ?? "free";
}
