import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal } from "@/lib/fal";
import { getUserCredits, chargeCredits } from "@/lib/credits";
import { buildScenePrompt, HF_SIZE_MAP } from "@/lib/scene-prompt";

const CREDIT_COST = 2;

export async function POST(req: NextRequest) {
  try {
    const { prompt, ratio = "1:1" } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Describe the new background" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const credits = await getUserCredits(user.id);
    if (credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    const dims = HF_SIZE_MAP[ratio] ?? HF_SIZE_MAP["1:1"];
    const scenePrompt = buildScenePrompt(prompt.trim());

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: scenePrompt,
        image_size: { width: dims.width, height: dims.height },
        num_inference_steps: 4,
      },
    });

    const image = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!image) {
      console.error("fal flux/schnell (replace-bg) returned no image:", result);
      return NextResponse.json({ error: "Background generation failed. Try again." }, { status: 502 });
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "replace-bg",
        status: "completed",
        prompt: prompt.trim(),
        credit_cost: CREDIT_COST,
        completed_at: new Date().toISOString(),
        metadata: { images: [image], aspectRatio: ratio, productPreserved: true },
      })
      .select("id")
      .single();
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = await chargeCredits(user.id, CREDIT_COST, credits, "Replace background");

    return NextResponse.json({ image, credits: newCredits, generationId: insertedRow?.id ?? null });
  } catch (e) {
    console.error("Replace-bg route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
