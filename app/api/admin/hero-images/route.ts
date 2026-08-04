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

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { mode, templateIds, customImageUrls } = await req.json();
  if (!["random", "selected", "custom"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .upsert({
      id: "hero_images",
      value: {
        mode,
        templateIds: Array.isArray(templateIds) ? templateIds : [],
        customImageUrls: Array.isArray(customImageUrls) ? customImageUrls : [],
      },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Admin hero-images update error:", error.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
