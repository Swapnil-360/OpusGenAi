import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal } from "@/lib/fal";
import { getUserCredits, chargeCredits, refundCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { getUserPlan } from "@/lib/entitlements";
import { VIDEO_TIER, isPlanAtLeast } from "@/lib/plans";
import { rejectIfBot } from "@/lib/bot-protect";

const DEFAULT_MOTION_PROMPT = "smooth cinematic camera motion, subtle zoom, natural movement";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt } = await req.json();

    // Scoped to images this app already generated (verified format:
    // https://v3b.fal.media/files/...) — not a general image-to-video proxy
    // for arbitrary URLs. This route never fetches imageUrl itself (fal's own
    // servers do), so this isn't an SSRF control; it's what keeps credits
    // tied to content actually produced through the product.
    if (typeof imageUrl !== "string" || !/^https:\/\/[^/]*fal\.(media|ai|run)\//.test(imageUrl)) {
      return NextResponse.json({ error: "A generated image is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to generate videos." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    const isUnlimited = hasUnlimitedCredits(user.email);
    if (!isUnlimited) {
      const plan = await getUserPlan(user.id);
      if (!isPlanAtLeast(plan, VIDEO_TIER.minPlan)) {
        return NextResponse.json({ error: "Upgrade to Pro to unlock Image-to-Video." }, { status: 403 });
      }
    }

    const cost = VIDEO_TIER.creditCost;
    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < cost) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    // Charged before submitting, not after completion — the job costs fal
    // money once it's queued regardless of whether the client stays
    // connected. Refunded below if the submit call itself fails, and by the
    // status route if the job later fails on fal's side.
    const newCredits = isUnlimited
      ? UNLIMITED_CREDITS_DISPLAY
      : await chargeCredits(user.id, cost, credits, "Image-to-video");

    const admin = createAdminClient();
    const motionPrompt = typeof prompt === "string" && prompt.trim() ? prompt.trim() : DEFAULT_MOTION_PROMPT;

    const { data: row, error: insertError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "image-to-video",
        status: "pending",
        prompt: motionPrompt,
        input_image_url: imageUrl,
        credit_cost: cost,
        metadata: { resolution: VIDEO_TIER.resolution, durationSeconds: VIDEO_TIER.durationSeconds },
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("generations insert failed:", insertError?.message);
      if (!isUnlimited) await refundCredits(user.id, cost, newCredits, "Image-to-video (failed to start)");
      return NextResponse.json({ error: "Failed to start generation. Try again." }, { status: 500 });
    }

    try {
      const { request_id } = await fal.queue.submit(VIDEO_TIER.model, {
        input: {
          prompt: motionPrompt,
          image_url: imageUrl,
          resolution: VIDEO_TIER.resolution,
          duration: String(VIDEO_TIER.durationSeconds),
          generate_audio: true,
        },
      });

      await admin
        .from("generations")
        .update({ metadata: { resolution: VIDEO_TIER.resolution, durationSeconds: VIDEO_TIER.durationSeconds, requestId: request_id } })
        .eq("id", row.id);

      return NextResponse.json({ generationId: row.id, credits: newCredits });
    } catch (submitError) {
      console.error("fal.queue.submit failed:", submitError);
      await admin
        .from("generations")
        .update({ status: "failed", error_message: "Failed to start video generation." })
        .eq("id", row.id);
      const refunded = isUnlimited
        ? newCredits
        : await refundCredits(user.id, cost, newCredits, "Image-to-video (submit failed)");
      return NextResponse.json({ error: "Failed to start video generation.", credits: refunded }, { status: 502 });
    }
  } catch (e) {
    console.error("generate-video route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
