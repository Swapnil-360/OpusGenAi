import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CAPTION_LENGTH = 300;

/**
 * A signed-in user submits one of their own completed generations for the
 * public gallery. Lands as `status: "pending"` — an admin has to approve it
 * before it's visible anywhere (RLS on gallery_items only exposes
 * status='approved' rows to anon/authenticated).
 *
 * caption is the user's own free text, never the generation's stored
 * `prompt` — that column can hold a resolved template prompt, which this app
 * deliberately never surfaces (see the prompt-hiding work elsewhere in this
 * codebase). Auto-filling a public caption from it would leak exactly what
 * that work was protecting.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit to the gallery." }, { status: 401 });
  }

  const { generationId, caption } = await req.json().catch(() => ({}));
  if (typeof generationId !== "string" || !generationId) {
    return NextResponse.json({ error: "generationId is required." }, { status: 400 });
  }
  if (caption !== undefined && caption !== null && typeof caption !== "string") {
    return NextResponse.json({ error: "Invalid caption." }, { status: 400 });
  }
  const trimmedCaption = typeof caption === "string" ? caption.trim().slice(0, MAX_CAPTION_LENGTH) : null;

  const admin = createAdminClient();

  // Ownership + completion check happens against the service-role read, not
  // client-supplied data — a user can only ever submit a row that is both
  // theirs and actually finished.
  const { data: generation } = await admin
    .from("generations")
    .select("id, user_id, status, metadata")
    .eq("id", generationId)
    .single();

  if (!generation || generation.user_id !== user.id) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (generation.status !== "completed") {
    return NextResponse.json({ error: "Only completed generations can be submitted." }, { status: 400 });
  }

  const meta = (generation.metadata ?? {}) as { images?: string[]; videoUrl?: string };
  const isVideo = typeof meta.videoUrl === "string" && meta.videoUrl.length > 0;
  const image = Array.isArray(meta.images) ? meta.images[0] : undefined;

  if (!isVideo && !image) {
    return NextResponse.json({ error: "This generation has no output to submit." }, { status: 400 });
  }

  const { error } = await admin.from("gallery_items").insert({
    generation_id: generationId,
    media_type: isVideo ? "video" : "image",
    media_url: isVideo ? meta.videoUrl : image,
    cover_image_url: isVideo ? null : null, // no separate poster for a user's own image submission
    caption: trimmedCaption,
    submitted_by: user.id,
    source: "user_submitted",
    status: "pending",
  });

  if (error) {
    // Unique index on generation_id — the friendly path for "you already submitted this one".
    if (error.code === "23505") {
      return NextResponse.json({ error: "You've already submitted this one." }, { status: 409 });
    }
    console.error("Gallery submit error:", error.message);
    return NextResponse.json({ error: "Failed to submit. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
