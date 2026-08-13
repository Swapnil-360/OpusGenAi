import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

const VALID_TEMPLATE_TYPES = ["production", "universal", "campaign", "video"] as const;

/**
 * Templates *with* their prompts, admin only.
 *
 * The prompt column is revoked from anon and authenticated alike, and the
 * user-facing /api/templates strips it — but the admin panel exists to edit
 * prompts, so it needs the real thing. Service-role read behind an admin check.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("templates")
    .select("id,name,template_type,category,description,tags,prompt,cover_image_url,preview_video_url,accent_color,is_pro,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Admin templates list error:", error.message);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, templateType, category, description, tags, prompt, accentColor, isPro, sortOrder } = await req.json();

  if (!name?.trim() || !category?.trim() || !description?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "Name, category, description, and prompt are required" }, { status: 400 });
  }
  // Was still rejecting everything but production/universal, so the campaign
  // and video types added later couldn't be created from the admin panel.
  if (!VALID_TEMPLATE_TYPES.includes(templateType)) {
    return NextResponse.json(
      { error: `templateType must be one of: ${VALID_TEMPLATE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("templates")
    .insert({
      name: name.trim(),
      template_type: templateType,
      category: category.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : [],
      prompt: prompt.trim(),
      accent_color: accentColor || "#dc2626",
      is_pro: !!isPro,
      sort_order: typeof sortOrder === "number" ? sortOrder : 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Admin template create error:", error.message);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
