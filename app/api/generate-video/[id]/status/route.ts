import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@/lib/fal";
import { getUserCredits, refundCredits, hasUnlimitedCredits } from "@/lib/credits";
import { VIDEO_TIERS, type VideoQuality } from "@/lib/plans";

type VideoMetadata = {
  quality?: VideoQuality;
  resolution: string;
  durationSeconds: number;
  requestId?: string;
  videoUrl?: string;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Explicit ownership check even though this uses the admin client — the
  // equivalent RLS policy (generations_select_own) only applies to the
  // session client, and this route needs the admin client to WRITE status
  // transitions, so the read path must enforce ownership itself.
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const meta = (row.metadata ?? {}) as VideoMetadata;

  if (row.status !== "pending") {
    return NextResponse.json({ status: row.status, videoUrl: meta.videoUrl, error: row.error_message });
  }

  if (!meta.requestId) {
    return NextResponse.json({ status: "pending" });
  }

  // Which model this row's request_id belongs to — three possible models now,
  // so this can't be a single hardcoded constant like it was for the v1
  // single-tier version. Falls back to "standard" only for rows submitted
  // before `quality` was recorded.
  const model = VIDEO_TIERS[meta.quality ?? "standard"].model;

  try {
    const queueStatus = await fal.queue.status(model, { requestId: meta.requestId, logs: false });

    if (queueStatus.status !== "COMPLETED") {
      return NextResponse.json({ status: "pending" });
    }

    const result = await fal.queue.result(model, { requestId: meta.requestId });
    const videoUrl = (result.data as { video?: { url: string } })?.video?.url;
    if (!videoUrl) throw new Error("No video URL in fal result");

    await admin
      .from("generations")
      .update({ status: "completed", metadata: { ...meta, videoUrl }, completed_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ status: "completed", videoUrl });
  } catch (err) {
    // fal's queue types don't model a distinct FAILED status — a generation
    // failure surfaces as queue.result() throwing once status reaches
    // COMPLETED, or as either call rejecting outright. Either way, this is
    // the terminal failure path: refund, mark the row, tell the client.
    console.error("generate-video status/result error:", err);
    const errorMessage = err instanceof Error ? err.message : "Video generation failed.";

    await admin
      .from("generations")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", id);

    if (!hasUnlimitedCredits(user.email)) {
      const credits = await getUserCredits(user.id);
      // Refunds exactly what this row actually charged — not a tier
      // constant — so a failed Premium (88cr) job refunds 88, not whatever
      // Standard costs.
      await refundCredits(user.id, row.credit_cost, credits, "Image-to-video (generation failed)");
    }

    return NextResponse.json({ status: "failed", error: errorMessage });
  }
}
