import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits, hasUnlimitedCredits } from "@/lib/credits";

const CREDIT_COST = 3;

export async function POST(req: NextRequest) {
  try {
    const { image, mask, prompt, ratio } = await req.json();

    if (!image || !mask) {
      return NextResponse.json({ error: "Image and mask are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const isUnlimited = hasUnlimitedCredits(user.email);
    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    const [imageUrl, maskUrl] = await Promise.all([
      uploadDataUrlToFal(image),
      uploadDataUrlToFal(mask),
    ]);

    const fillPrompt = prompt?.trim()
      ? `${prompt.trim()}, seamless extension of the existing scene, matching lighting and perspective`
      : "seamless extension of the existing scene, matching lighting, color and perspective, photorealistic";

    const result = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
      input: { image_url: imageUrl, mask_url: maskUrl, prompt: fillPrompt },
    });

    const outputUrl = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!outputUrl) {
      console.error("fal fill (uncrop) returned no image:", result);
      return NextResponse.json({ error: "Expand failed. Try again." }, { status: 502 });
    }

    const { error: insertError } = await supabase.from("generations").insert({
      user_id: user.id,
      tool_id: "uncrop",
      status: "completed",
      prompt: prompt?.trim() || null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [outputUrl], aspectRatio: ratio },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = isUnlimited
      ? credits
      : await chargeCredits(user.id, CREDIT_COST, credits, "Uncrop / expand image");

    return NextResponse.json({ image: outputUrl, credits: newCredits });
  } catch (e) {
    console.error("Uncrop route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
