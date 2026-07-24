import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits } from "@/lib/credits";
import { buildScenePrompt, buildProductEditPrompt, HF_SIZE_MAP as SIZE_MAP } from "@/lib/scene-prompt";

const CREDIT_COST = 1;
// Premium path regenerates the whole image via a paid model — priced higher
// than the free flux/schnell path to cover the ~13x cost difference
// ($0.039/image vs ~$0.003-0.006/mp).
const PREMIUM_CREDIT_COST = 3;

// Valid aspect ratios for fal-ai/gemini-25-flash-image/edit — our SIZE_MAP
// keys (1:1, 4:5, 9:16, 16:9, 4:3) are all supported natively, no mapping needed.

export async function POST(req: NextRequest) {
  try {
    const { prompt, ratio = "1:1", templateId, mode, image: inputImage } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // ── Auth + credit check ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to generate images." }, { status: 401 });
    }

    const isPremium = mode === "premium";
    const cost = isPremium ? PREMIUM_CREDIT_COST : CREDIT_COST;

    const credits = await getUserCredits(user.id);
    if (credits < cost) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    let image: string | undefined;

    if (isPremium) {
      if (!inputImage) {
        return NextResponse.json({ error: "Product photo is required for this mode." }, { status: 400 });
      }
      const imageUrl = await uploadDataUrlToFal(inputImage);
      const result = await fal.subscribe("fal-ai/gemini-25-flash-image/edit", {
        input: {
          image_urls: [imageUrl],
          prompt: buildProductEditPrompt(prompt.trim()),
          aspect_ratio: ratio,
          num_images: 1,
          output_format: "png",
        },
      });
      image = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
      if (!image) {
        console.error("fal gemini-25-flash-image/edit returned no image:", result);
        return NextResponse.json({ error: "Generation failed. Try again." }, { status: 502 });
      }
    } else {
      // ── Generate (free path) ──
      const dims = SIZE_MAP[ratio] ?? SIZE_MAP["1:1"];
      const isBackgroundOnly = mode === "background";
      const modelInput = isBackgroundOnly ? buildScenePrompt(prompt.trim()) : prompt.trim();

      const result = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: modelInput,
          image_size: { width: dims.width, height: dims.height },
          num_inference_steps: 4,
        },
      });

      image = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
      if (!image) {
        console.error("fal flux/schnell returned no image:", result);
        return NextResponse.json({ error: "Generation failed. Try again." }, { status: 502 });
      }
    }

    // ── Persist + charge (server-side, so it can't be skipped) ──
    const { data: insertedRow, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "generate",
        status: "completed",
        prompt: prompt.trim(),
        credit_cost: cost,
        completed_at: new Date().toISOString(),
        metadata: {
          images: [image],
          aspectRatio: ratio,
          templateId: templateId ?? undefined,
          productPreserved: mode === "background" || undefined,
          engine: isPremium ? "gemini-25-flash-image" : undefined,
        },
      })
      .select("id")
      .single();
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = await chargeCredits(user.id, cost, credits, isPremium ? "Premium AI product photo" : "Image generation");

    return NextResponse.json({ image, credits: newCredits, generationId: insertedRow?.id ?? null });
  } catch (e) {
    console.error("Generate route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
