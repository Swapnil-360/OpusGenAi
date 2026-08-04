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

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, templateType, category, description, tags, prompt, accentColor, isPro, sortOrder } = await req.json();

  if (!name?.trim() || !category?.trim() || !description?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "Name, category, description, and prompt are required" }, { status: 400 });
  }
  if (templateType !== "production" && templateType !== "universal") {
    return NextResponse.json({ error: "templateType must be \"production\" or \"universal\"" }, { status: 400 });
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
