import type { SupabaseClient } from "@supabase/supabase-js";
import { fal } from "@/lib/fal";
import { getUserCredits, refundCredits, hasUnlimitedCredits } from "@/lib/credits";
import { VIDEO_TIERS, type VideoQuality } from "@/lib/plans";

export type VideoRowMetadata = {
  quality?: VideoQuality | "multi";
  /** The actual fal model this row was submitted to. Rows created before this
   *  field existed fall back to deriving it from `quality` below — that
   *  fallback only covers VIDEO_TIERS' three keys, never "multi", since no
   *  row using the multi-image tier predates this field. */
  model?: string;
  resolution: string;
  durationSeconds: number;
  requestId?: string;
  videoUrl?: string;
};

export type PendingVideoRow = {
  id: string;
  user_id: string;
  status: string;
  error_message: string | null;
  credit_cost: number;
  metadata: unknown;
};

/** Which fal endpoint a row's request_id belongs to. */
export function resolveVideoModel(meta: VideoRowMetadata): string {
  return meta.model ?? VIDEO_TIERS[(meta.quality as VideoQuality) ?? "standard"].model;
}

/**
 * Checks a single pending video row against fal and, if it's actually
 * finished (either way), writes the terminal state — completed+videoUrl, or
 * failed+refund. A still-in-progress row is left untouched and returned as
 * `{ status: "pending" }`, so this is safe to call speculatively any time a
 * pending row is in view, not just from the one place that originally
 * started the poll.
 *
 * This is what lets a generation "survive" the user closing the tab: fal
 * keeps processing the job regardless of whether anyone is polling it, but
 * without something eventually calling this, our own `generations` row would
 * stay "pending" forever even after fal finished — completion was only ever
 * detected as a side effect of the live status-poll route running. Called
 * from there, and now also opportunistically from /api/history, so simply
 * reopening the app settles anything that finished while the user was away.
 */
export async function settlePendingVideoRow(
  admin: SupabaseClient,
  row: PendingVideoRow,
  userEmail: string | null | undefined
): Promise<{ status: "pending" | "completed" | "failed"; videoUrl?: string; error?: string }> {
  const meta = (row.metadata ?? {}) as VideoRowMetadata;

  if (!meta.requestId) return { status: "pending" };

  const model = resolveVideoModel(meta);

  try {
    const queueStatus = await fal.queue.status(model, { requestId: meta.requestId, logs: false });
    if (queueStatus.status !== "COMPLETED") {
      return { status: "pending" };
    }

    const result = await fal.queue.result(model, { requestId: meta.requestId });
    const videoUrl = (result.data as { video?: { url: string } })?.video?.url;
    if (!videoUrl) throw new Error("No video URL in fal result");

    await admin
      .from("generations")
      .update({ status: "completed", metadata: { ...meta, videoUrl }, completed_at: new Date().toISOString() })
      .eq("id", row.id);

    return { status: "completed", videoUrl };
  } catch (err) {
    // fal's queue types don't model a distinct FAILED status — a generation
    // failure surfaces as queue.result() throwing once status reaches
    // COMPLETED, or as either call rejecting outright. Either way, this is
    // the terminal failure path: refund, mark the row.
    console.error(`settlePendingVideoRow: generation ${row.id} failed:`, err);
    const errorMessage = err instanceof Error ? err.message : "Video generation failed.";

    await admin
      .from("generations")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", row.id);

    if (!hasUnlimitedCredits(userEmail)) {
      const credits = await getUserCredits(row.user_id);
      // Refunds exactly what this row actually charged — not a tier
      // constant — so a failed Premium (88cr) job refunds 88, not whatever
      // Standard costs.
      await refundCredits(row.user_id, row.credit_cost, credits, "Image-to-video (generation failed)");
    }

    return { status: "failed", error: errorMessage };
  }
}
