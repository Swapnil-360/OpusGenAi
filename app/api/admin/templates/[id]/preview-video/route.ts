import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateTemplatesCache } from "@/lib/cache";

const BUCKET = "template-videos";
const MAX_BYTES = 50 * 1024 * 1024; // matches the bucket's own file_size_limit
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Magic-byte sniff — catches a file whose MIME type/extension claims to be a
 * video but whose actual bytes aren't (wrong file picked, truncated upload,
 * a renamed non-video file). MP4 and MOV are both ISO Base Media containers
 * ("ftyp" at byte offset 4); WebM is Matroska/EBML (fixed 4-byte header).
 * Not a full validity check — just enough to reject an obviously-wrong file
 * before it gets stored and silently fails to play on the landing page.
 */
function looksLikeVideo(bytes: ArrayBuffer, contentType: string): boolean {
  if (bytes.byteLength < 12) return false;
  const bufferBytes = new Uint8Array(bytes, 0, 12);
  if (contentType === "video/webm") {
    return bufferBytes[0] === 0x1a && bufferBytes[1] === 0x45 && bufferBytes[2] === 0xdf && bufferBytes[3] === 0xa3;
  }
  // mp4 / quicktime
  const ftyp = String.fromCharCode(bufferBytes[4], bufferBytes[5], bufferBytes[6], bufferBytes[7]);
  return ftyp === "ftyp";
}

/**
 * Sets a video template's landing-page preview clip, from either source:
 *
 *   • a raw video body (Content-Type: video/*) — an uploaded file, posted as
 *     bytes rather than a base64 data URL, since base64 inflates a multi-MB
 *     clip by another third for no reason
 *   • { sourceUrl } — one of the admin's own generated videos
 *
 * Either way the bytes end up in our own public bucket. Pointing the column
 * straight at a fal.media URL would work today but leaves the landing page
 * depending on fal's retention of a file we don't control, so a picked
 * generation is copied rather than linked.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  const { data: tpl } = await admin.from("templates").select("id, template_type").eq("id", id).single();
  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (tpl.template_type !== "video") {
    return NextResponse.json({ error: "Only video templates can have a preview clip." }, { status: 400 });
  }

  const requestType = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  // Browsers commonly report an empty `file.type` for .mov specifically —
  // the client sends the real filename as a fallback signal so a video
  // upload isn't misdetected as the (unrelated) sourceUrl JSON path below
  // just because the MIME sniff came back generic or wrong.
  const fileName = req.headers.get("x-file-name");
  const extFromName = fileName ? decodeURIComponent(fileName).split(".").pop()?.toLowerCase() : undefined;
  const mimeFromExt =
    extFromName === "webm" ? "video/webm" :
    extFromName === "mov" ? "video/quicktime" :
    extFromName === "mp4" ? "video/mp4" :
    undefined;
  const isVideoUpload = requestType.startsWith("video/") || !!mimeFromExt;

  let bytes: ArrayBuffer;
  let contentType: string;

  if (isVideoUpload) {
    // Prefer the browser's own MIME type when it's one we recognize; the
    // filename-derived type is the fallback for exactly the case above, not
    // a silent override of a MIME type that was already correct.
    const resolvedType = ALLOWED_TYPES.includes(requestType) ? requestType : mimeFromExt;
    if (!resolvedType) {
      return NextResponse.json({ error: "Use an MP4, WebM, or MOV file." }, { status: 400 });
    }
    bytes = await req.arrayBuffer();
    if (!looksLikeVideo(bytes, resolvedType)) {
      return NextResponse.json({ error: "That file doesn't look like a valid video. Try re-exporting it." }, { status: 400 });
    }
    contentType = resolvedType;
  } else {
    const { sourceUrl } = await req.json().catch(() => ({ sourceUrl: null }));
    if (typeof sourceUrl !== "string" || !/^https:\/\/[a-z0-9.-]*fal\.media\//i.test(sourceUrl)) {
      return NextResponse.json({ error: "Invalid video source." }, { status: 400 });
    }
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Couldn't fetch that video. It may have expired." }, { status: 502 });
    }
    bytes = await res.arrayBuffer();
    contentType = res.headers.get("content-type")?.split(";")[0].trim() || "video/mp4";
    if (!ALLOWED_TYPES.includes(contentType)) contentType = "video/mp4";
  }

  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "That video is over 50MB. Use a shorter or smaller clip." }, { status: 413 });
  }

  const ext = contentType === "video/webm" ? "webm" : contentType === "video/quicktime" ? "mov" : "mp4";
  const path = `${id}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (uploadError) {
    console.error("Template preview video upload error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await admin
    .from("templates")
    .update({ preview_video_url: bustedUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) {
    console.error("Template preview_video_url update error:", updateError.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  invalidateTemplatesCache();

  return NextResponse.json({ url: bustedUrl });
}

/** Removes the preview clip — the card falls back to its cover image. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  // Best-effort: clearing the column is what actually hides the clip, so a
  // failure to remove the stored object shouldn't fail the request.
  await admin.storage.from(BUCKET).remove([`${id}.mp4`, `${id}.webm`, `${id}.mov`]);

  const { error } = await admin
    .from("templates")
    .update({ preview_video_url: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Template preview video clear error:", error.message);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }

  invalidateTemplatesCache();

  return NextResponse.json({ ok: true });
}
