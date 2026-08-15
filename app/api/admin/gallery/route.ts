import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "gallery-uploads";
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
const MAX_CAPTION_LENGTH = 300;

export const dynamic = "force-dynamic";

/** Every submission regardless of status — this is the review queue, so it
 *  needs pending/rejected rows too, unlike the public RLS-gated read. */
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_items")
    .select(`
      id, generation_id, media_type, media_url, cover_image_url, caption,
      submitted_by, source, status, sort_order, created_at, approved_at,
      submitter:profiles!gallery_items_submitted_by_fkey(full_name)
    `)
    .order("status", { ascending: true }) // pending sorts before approved/rejected alphabetically — reviewer sees the queue first
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin gallery list error:", error.message);
    return NextResponse.json({ error: "Failed to load gallery items" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

/**
 * Admin adds an item directly — no review step, since the admin adding it
 * *is* the review. Two shapes, same as the template preview-video route:
 *
 *   • a raw image/video body (Content-Type: image/* or video/*) — admin's
 *     own file, stored in gallery-uploads. Caption isn't carried on this
 *     path (no multipart form data anywhere in this app); PATCH afterward
 *     to add one.
 *   • { generationId, caption? } — picks any user's existing completed
 *     generation, same derivation logic as the user-facing submit route.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const requestType = (req.headers.get("content-type") ?? "").split(";")[0].trim();

  if (requestType.startsWith("image/") || requestType.startsWith("video/")) {
    if (!ALLOWED_TYPES.includes(requestType)) {
      return NextResponse.json({ error: "Use a JPEG, PNG, WebP, MP4, WebM, or MOV file." }, { status: 400 });
    }
    const bytes = await req.arrayBuffer();
    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: "That file is empty." }, { status: 400 });
    }
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "That file is over 50MB." }, { status: 413 });
    }

    const isVideo = requestType.startsWith("video/");
    const ext = requestType.split("/")[1].replace("jpeg", "jpg").replace("quicktime", "mov");
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: requestType, upsert: false });
    if (uploadError) {
      console.error("Gallery upload error:", uploadError.message);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

    const { data: row, error: insertError } = await admin
      .from("gallery_items")
      .insert({
        media_type: isVideo ? "video" : "image",
        media_url: publicUrl,
        source: "admin_added",
        status: "approved",
        reviewed_by: adminUser.id,
        approved_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("Gallery item insert error:", insertError?.message);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ id: row.id, url: publicUrl });
  }

  const { generationId, caption } = await req.json().catch(() => ({}));
  if (typeof generationId !== "string" || !generationId) {
    return NextResponse.json({ error: "generationId is required." }, { status: 400 });
  }
  const trimmedCaption = typeof caption === "string" ? caption.trim().slice(0, MAX_CAPTION_LENGTH) : null;

  const { data: generation } = await admin
    .from("generations")
    .select("id, status, metadata")
    .eq("id", generationId)
    .single();
  if (!generation) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }
  if (generation.status !== "completed") {
    return NextResponse.json({ error: "That generation isn't completed." }, { status: 400 });
  }

  const meta = (generation.metadata ?? {}) as { images?: string[]; videoUrl?: string };
  const isVideo = typeof meta.videoUrl === "string" && meta.videoUrl.length > 0;
  const image = Array.isArray(meta.images) ? meta.images[0] : undefined;
  if (!isVideo && !image) {
    return NextResponse.json({ error: "That generation has no output." }, { status: 400 });
  }

  const { data: row, error } = await admin
    .from("gallery_items")
    .insert({
      generation_id: generationId,
      media_type: isVideo ? "video" : "image",
      media_url: isVideo ? meta.videoUrl : image,
      caption: trimmedCaption,
      source: "admin_added",
      status: "approved",
      reviewed_by: adminUser.id,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !row) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "That generation is already in the gallery." }, { status: 409 });
    }
    console.error("Gallery item insert error:", error?.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ id: row.id });
}
