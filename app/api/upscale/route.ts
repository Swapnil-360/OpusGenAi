import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@/lib/fal";
import { getUserCredits, chargeCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { rejectIfBot } from "@/lib/bot-protect";

// Was Hugging Face's caidas/swin2SR-realworld-sr-x4-large via router.huggingface.co
// — HF stopped serving that model through the hf-inference provider ("Model
// not supported by provider hf-inference", confirmed in production logs),
// breaking this tool outright with no code change on our side. Migrated to
// fal.ai (fal-ai/esrgan), matching every other image tool in this app.
const MODEL = "fal-ai/esrgan";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CREDIT_COST = 2;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    // The tool UI has always advertised "2 credits" (ToolPageShell, the
    // upscale button label) — this just makes the charge match what was
    // already promised instead of silently charging nothing.
    const isUnlimited = hasUnlimitedCredits(user.email);
    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)." }, { status: 413 });
    }

    // Scale and face-enhancement map onto real UI controls (previously never
    // even sent to this route, so neither did anything). "AI sharpening" /
    // "Noise reduction" / "Micro-detail boost" stay UI-only — ESRGAN doesn't
    // expose separate knobs for those; upscaling itself already sharpens and
    // denoises, so there's no distinct model parameter to wire them to.
    const scale = formData.get("scale") === "4" ? 4 : 2;
    const face = formData.get("face") === "true";

    let imageUrl: string;
    try {
      imageUrl = await fal.storage.upload(file);
    } catch (uploadError) {
      console.error("fal.storage.upload failed (upscale):", uploadError);
      return NextResponse.json({ error: "Failed to process the uploaded image." }, { status: 400 });
    }

    let upscaledUrl: string | undefined;
    try {
      const result = await fal.subscribe(MODEL, { input: { image_url: imageUrl, scale, face } });
      upscaledUrl = (result.data as { image?: { url: string } })?.image?.url;
    } catch (err) {
      console.error("fal esrgan error:", err);
    }

    if (!upscaledUrl) {
      return NextResponse.json({ error: "Upscale failed. Try again." }, { status: 502 });
    }

    const { error: insertError } = await createAdminClient().from("generations").insert({
      user_id: user.id,
      tool_id: "upscale",
      status: "completed",
      prompt: null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [upscaledUrl] },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    // Atomic: deducts only if the balance still covers it, so concurrent
    // requests can't both clear the read-only check above and both go free.
    let newCredits: number;
    if (isUnlimited) {
      newCredits = UNLIMITED_CREDITS_DISPLAY;
    } else {
      const charged = await chargeCredits(user.id, CREDIT_COST, "Upscale 4×");
      if (charged === null) {
        return NextResponse.json(
          { error: "You're out of credits. Upgrade your plan to keep generating." },
          { status: 402 }
        );
      }
      newCredits = charged;
    }

    return NextResponse.json({ image: upscaledUrl, credits: newCredits });
  } catch (err) {
    console.error("upscale route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
