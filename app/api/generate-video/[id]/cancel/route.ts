import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@/lib/fal";
import { getUserCredits, refundCredits, hasUnlimitedCredits } from "@/lib/credits";
import { resolveVideoModel, settlePendingVideoRow, type VideoRowMetadata } from "@/lib/video-status";

/**
 * User-initiated cancel for a still-pending video generation.
 *
 * Best-effort against fal's own queue.cancel — it can reject once a job is
 * far enough along to no longer be stoppable, and there's no way to force
 * that from here. What actually decides whether the user is charged is a
 * fresh status check against fal *after* attempting the cancel: if the job
 * had already completed (a real race — the user clicked Cancel right as it
 * finished), they get the video, not a refund for output that was actually
 * delivered. If it's genuinely still pending, it's refunded and marked
 * cancelled regardless of whether fal's own cancel call succeeded — this
 * app's contract is that "cancelled" means not charged, not "cancelled if
 * fal's infrastructure cooperated."
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("generations")
    .select("id, user_id, status, error_message, credit_cost, metadata")
    .eq("id", id)
    .single();

  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (row.status !== "pending") {
    // Already resolved — most likely fal finished right as Cancel was
    // clicked. Tell the client what actually happened instead of a generic
    // "can't cancel" error.
    const meta = (row.metadata ?? {}) as VideoRowMetadata;
    return NextResponse.json({ status: row.status, videoUrl: meta.videoUrl, error: row.error_message, cancelled: false });
  }

  const meta = (row.metadata ?? {}) as VideoRowMetadata;
  if (meta.requestId) {
    try {
      await fal.queue.cancel(resolveVideoModel(meta), { requestId: meta.requestId });
    } catch (err) {
      // Expected once a job is too far along to stop — not fatal, the
      // status check below is what actually decides the outcome.
      console.error(`cancel: fal.queue.cancel rejected for generation ${id}:`, err);
    }
  }

  const settled = await settlePendingVideoRow(admin, row, user.email);

  if (settled.status !== "pending") {
    // Either it had actually completed (settled as "completed" — the user
    // gets the video, no refund) or it failed on fal's side independently
    // (settlePendingVideoRow already refunded that case). Neither is "the
    // user's cancel took effect", so cancelled: false either way.
    return NextResponse.json({ ...settled, cancelled: false });
  }

  // Still pending after the cancel attempt and a fresh status check — treat
  // it as cancelled on our side regardless of what fal's queue ends up doing
  // with the job it was told to stop.
  const newCredits = hasUnlimitedCredits(user.email)
    ? null
    : await refundCredits(user.id, row.credit_cost, await getUserCredits(user.id), "Image-to-video (cancelled by user)");

  await admin
    .from("generations")
    .update({ status: "failed", error_message: "Cancelled by you." })
    .eq("id", id);

  return NextResponse.json({ status: "failed", error: "Cancelled by you.", cancelled: true, credits: newCredits });
}
