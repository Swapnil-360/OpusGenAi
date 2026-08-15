import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "gallery-uploads";
const MAX_CAPTION_LENGTH = 300;
const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

/** Approve/reject a submission, or edit its caption/sort_order. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!(VALID_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    update.status = body.status;
    update.reviewed_by = adminUser.id;
    // approved_at only ever moves forward when a status change actually
    // grants public visibility — a rejection or moving back to pending
    // clears it rather than leaving a stale timestamp on a row that's no
    // longer public.
    update.approved_at = body.status === "approved" ? new Date().toISOString() : null;
  }
  if (typeof body.caption === "string" || body.caption === null) {
    update.caption = typeof body.caption === "string" ? body.caption.trim().slice(0, MAX_CAPTION_LENGTH) : null;
  }
  if (typeof body.sortOrder === "number") {
    update.sort_order = body.sortOrder;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("gallery_items").update(update).eq("id", id);

  if (error) {
    console.error("Admin gallery update error:", error.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const admin = createAdminClient();

  // Best-effort: only admin-uploaded files live in our own bucket (a path
  // with no directory prefix, just "<uuid>.<ext>") — a submitted generation's
  // media_url points at fal/Supabase storage this route doesn't own and
  // shouldn't try to delete. Row removal below is what actually matters;
  // a leftover unreferenced file here is a cheap trade for not risking a
  // delete against the wrong bucket path.
  const { data: row } = await admin.from("gallery_items").select("media_url, source").eq("id", id).single();
  if (row?.source === "admin_added" && row.media_url.includes(`/${BUCKET}/`)) {
    const path = row.media_url.split(`/${BUCKET}/`)[1]?.split("?")[0];
    if (path) await admin.storage.from(BUCKET).remove([path]);
  }

  const { error } = await admin.from("gallery_items").delete().eq("id", id);
  if (error) {
    console.error("Admin gallery delete error:", error.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
