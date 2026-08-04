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

// Accepts a single image as a data: URL, stores it in the public hero-images
// bucket, returns the public URL. Kept separate from /api/admin/hero-images
// (which just saves the {mode, templateIds, customImageUrls} config) so the
// admin UI can upload photos one at a time before saving the list.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dataUrl } = await req.json();
  if (typeof dataUrl !== "string" || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl)) {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const contentType = dataUrl.slice(5, dataUrl.indexOf(";"));
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const path = `${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("hero-images")
    .upload(path, buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error("Hero image upload error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("hero-images").getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
