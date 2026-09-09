import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_USER_HISTORY = 20;

/**
 * Enforces the 20-generation storage retention limit per user.
 *
 * When a user accumulates more than `keepLimit` non-pending generations,
 * the oldest generations beyond the limit are automatically deleted (FIFO).
 * Any foreign key links in `credit_transactions` are safely unlinked first
 * so that financial ledgers remain intact and no FK constraint errors occur.
 */
export async function pruneUserHistory(
  adminClient?: ReturnType<typeof createAdminClient>,
  userId?: string,
  keepLimit: number = MAX_USER_HISTORY,
): Promise<{ prunedCount: number; totalRemaining: number }> {
  if (!userId) {
    return { prunedCount: 0, totalRemaining: 0 };
  }

  const admin = adminClient ?? createAdminClient();

  // 1. Fetch completed and failed generation IDs for this user, newest first
  const { data: userGens, error: selectError } = await admin
    .from("generations")
    .select("id, status, created_at")
    .eq("user_id", userId)
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  if (selectError) {
    console.error("Failed to query user history for pruning:", selectError.message);
    return { prunedCount: 0, totalRemaining: 0 };
  }

  if (!userGens || userGens.length <= keepLimit) {
    return { prunedCount: 0, totalRemaining: userGens?.length ?? 0 };
  }

  // 2. Identify the excess oldest generations beyond keepLimit
  const toDelete = userGens.slice(keepLimit);
  const toDeleteIds = toDelete.map((g) => g.id);

  if (toDeleteIds.length === 0) {
    return { prunedCount: 0, totalRemaining: userGens.length };
  }

  // 3. Nullify FK in credit_transactions to prevent FK violation while preserving accounting
  const { error: unlinkError } = await admin
    .from("credit_transactions")
    .update({ generation_id: null })
    .in("generation_id", toDeleteIds);

  if (unlinkError) {
    console.warn("Failed to unlink credit transactions during history prune:", unlinkError.message);
  }

  // 4. Delete the excess generations
  const { error: deleteError } = await admin
    .from("generations")
    .delete()
    .in("id", toDeleteIds)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Failed to delete excess generations during prune:", deleteError.message);
    return { prunedCount: 0, totalRemaining: userGens.length };
  }

  return {
    prunedCount: toDeleteIds.length,
    totalRemaining: keepLimit,
  };
}
