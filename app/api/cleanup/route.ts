import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits, hasUnlimitedCredits } from "@/lib/credits";

const CREDIT_COST = 1;

export async function POST(req: NextRequest) {
  try {
    const { image, mask, instructions } = await req.json();

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

    const fillPrompt = instructions?.trim()
      ? `remove ${instructions.trim()}, seamlessly fill with the surrounding background, photorealistic, matching lighting and texture`
      : "remove the marked object, seamlessly fill with the surrounding background, photorealistic, matching lighting and texture";

    const result = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
      input: { image_url: imageUrl, mask_url: maskUrl, prompt: fillPrompt },
    });

    const outputUrl = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!outputUrl) {
      console.error("fal fill (cleanup) returned no image:", result);
      return NextResponse.json({ error: "Cleanup failed. Try again." }, { status: 502 });
    }

    const { error: insertError } = await supabase.from("generations").insert({
      user_id: user.id,
      tool_id: "cleanup",
      status: "completed",
      prompt: instructions?.trim() || null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [outputUrl] },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = isUnlimited
      ? credits
      : await chargeCredits(user.id, CREDIT_COST, credits, "Cleanup / object removal");

    return NextResponse.json({ image: outputUrl, credits: newCredits });
  } catch (e) {
    console.error("Cleanup route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
