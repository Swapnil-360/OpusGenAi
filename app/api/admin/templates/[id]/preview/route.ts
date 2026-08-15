import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { fal } from "@/lib/fal";
import { invalidateTemplatesCache } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

// Generates (or regenerates) one template's marketing preview image via the
// app's own fal pipeline — this is an admin-triggered action against the
// admin's own FAL balance, separate from the user-facing credits/generations
// flow. There's no uploaded photo to preserve here (it's just a catalog
// preview), so this always goes through the free flux/schnell text-to-image
// path, not the premium edit path used for real user generations.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  const { data: tpl, error: fetchError } = await admin
    .from("templates")
    .select("prompt, template_type")
    .eq("id", id)
    .single();

  if (fetchError || !tpl) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const previewPrompt = tpl.template_type === "universal"
    ? `professional portrait photo of a person, ${tpl.prompt}`
    : `professional product photography, ${tpl.prompt}`;

  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: previewPrompt,
        image_size: { width: 800, height: 1000 },
        num_inference_steps: 4,
      },
    });

    const falUrl = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!falUrl) {
      console.error("fal flux/schnell returned no image for template preview:", result);
      return NextResponse.json({ error: "Preview generation failed" }, { status: 502 });
    }

    const imageRes = await fetch(falUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const path = `${id}.png`;

    const { error: uploadError } = await admin.storage
      .from("template-previews")
      .upload(path, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Template preview upload error:", uploadError.message);
      return NextResponse.json({ error: "Failed to store preview image" }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from("template-previews").getPublicUrl(path);
    // Cache-bust so regenerating a preview shows immediately instead of the
    // browser/CDN serving the previous image at the same path.
    const bustedUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await admin
      .from("templates")
      .update({ cover_image_url: bustedUrl, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Template cover_image_url update error:", updateError.message);
      return NextResponse.json({ error: "Failed to save preview image" }, { status: 500 });
    }

    invalidateTemplatesCache();

    return NextResponse.json({ url: bustedUrl });
  } catch (e) {
    console.error("Template preview generation error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
