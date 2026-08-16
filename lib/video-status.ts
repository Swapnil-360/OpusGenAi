import type { SupabaseClient } from "@supabase/supabase-js";
import { fal } from "@/lib/fal";
import { refundCredits, hasUnlimitedCredits } from "@/lib/credits";
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
      .eq("id", row.id)
      .eq("status", "pending");

    return { status: "completed", videoUrl };
  } catch (err) {
    // fal's queue types don't model a distinct FAILED status — a generation
    // failure surfaces as queue.result() throwing once status reaches
    // COMPLETED, or as either call rejecting outright. Either way, this is
    // the terminal failure path: refund, mark the row.
    console.error(`settlePendingVideoRow: generation ${row.id} failed:`, err);
    const errorMessage = err instanceof Error ? err.message : "Video generation failed.";

    const refunded = await failAndRefundOnce(
      admin,
      row,
      userEmail,
      errorMessage,
      "Image-to-video (generation failed)"
    );
    // Losing the claim means another in-flight caller (the live status poll
    // and History's reconciliation pass can easily overlap) already settled
    // and refunded this row. Report the outcome, don't refund twice.
    void refunded;

    return { status: "failed", error: errorMessage };
  }
}

/**
 * Marks a pending row failed and refunds it — **at most once**, no matter how
 * many callers race to settle the same generation.
 *
 * The claim is the `.eq("status", "pending")` filter: whichever caller's
 * UPDATE matches the row first flips it out of `pending` and gets the row
 * back, and every later caller matches zero rows and skips the refund. Both
 * the live status poll and History's reconciliation pass can settle the same
 * row concurrently, and the cancel route can race either of them, so without
 * this a single failed generation could be refunded several times over.
 *
 * Returns the new balance when this caller issued the refund, or null when it
 * lost the claim (or the user is on an unlimited account, which is never
 * charged and so never refunded).
 */
export async function failAndRefundOnce(
  admin: SupabaseClient,
  row: PendingVideoRow,
  userEmail: string | null | undefined,
  errorMessage: string,
  refundDescription: string
): Promise<number | null> {
  const { data: claimed } = await admin
    .from("generations")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id, credit_cost")
    .maybeSingle();

  if (!claimed) return null;

  if (hasUnlimitedCredits(userEmail)) return null;

  // Refunds what the row was actually charged, read back from the row this
  // update just claimed rather than from anything the caller passed in.
  return refundCredits(row.user_id, claimed.credit_cost, refundDescription);
}
