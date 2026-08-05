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

// Manual upload of a template's cover image — for templates where the
// honest preview is a real tool output (e.g. product-type presets), not the
// AI-generated marketing image /preview produces. Same bucket as /preview,
// just a supplied file instead of a fal.ai generation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const { dataUrl } = await req.json();
  if (typeof dataUrl !== "string" || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl)) {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tpl, error: fetchError } = await admin
    .from("templates")
    .select("id")
    .eq("id", id)
    .single();
  if (fetchError || !tpl) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const contentType = dataUrl.slice(5, dataUrl.indexOf(";"));
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const path = `${id}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("template-previews")
    .upload(path, buffer, { contentType, upsert: true });
  if (uploadError) {
    console.error("Template cover upload error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("template-previews").getPublicUrl(path);
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await admin
    .from("templates")
    .update({ cover_image_url: bustedUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) {
    console.error("Template cover_image_url update error:", updateError.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ url: bustedUrl });
}
