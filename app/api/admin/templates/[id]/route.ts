import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { invalidateTemplatesCache } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

const VALID_TEMPLATE_TYPES = ["production", "universal", "campaign", "video"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.name === "string") update.name = body.name.trim();
  // Same set the create route validates against — this used to only accept
  // production/universal, so re-categorizing a campaign or video template
  // (or just re-saving one unchanged) silently dropped the type from the
  // update instead of erroring, which was easy to miss since everything
  // else in the same PATCH still saved fine.
  if ((VALID_TEMPLATE_TYPES as readonly string[]).includes(body.templateType)) update.template_type = body.templateType;
  if (typeof body.category === "string") update.category = body.category.trim();
  if (typeof body.description === "string") update.description = body.description.trim();
  if (Array.isArray(body.tags)) update.tags = body.tags;
  if (typeof body.prompt === "string") update.prompt = body.prompt.trim();
  if (Array.isArray(body.imageSlotLabels)) update.image_slot_labels = body.imageSlotLabels;
  if (typeof body.accentColor === "string") update.accent_color = body.accentColor;
  if (typeof body.isPro === "boolean") update.is_pro = body.isPro;
  if (typeof body.sortOrder === "number") update.sort_order = body.sortOrder;

  const admin = createAdminClient();
  const { error } = await admin.from("templates").update(update).eq("id", id);

  if (error) {
    console.error("Admin template update error:", error.message);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }

  invalidateTemplatesCache();

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin.from("templates").delete().eq("id", id);

  if (error) {
    console.error("Admin template delete error:", error.message);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }

  invalidateTemplatesCache();

  return NextResponse.json({ ok: true });
}
