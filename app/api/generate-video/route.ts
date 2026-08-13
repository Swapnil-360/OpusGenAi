import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits, refundCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { getUserPlan } from "@/lib/entitlements";
import { VIDEO_TIERS, canUseVideoQuality, type VideoQuality } from "@/lib/plans";
import { resolveTemplatePrompt } from "@/lib/template-prompt";
import { rejectIfBot } from "@/lib/bot-protect";

const DEFAULT_MOTION_PROMPT = "smooth cinematic camera motion, subtle zoom, natural movement";
const DATA_URL_RE = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
const FAL_URL_RE = /^https:\/\/[^/]*fal\.(media|ai|run)\//;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt: userPrompt, templateId, placeholderValues, quality: rawQuality } = await req.json();

    // Either an image this app already generated (https://*.fal.media/...,
    // unchanged) or a fresh local upload (data:image/...;base64,) — the
    // latter gets uploaded to fal storage below via the same
    // uploadDataUrlToFal() call /api/generate's premium path already uses,
    // no new validation surface. This route never fetches imageUrl itself
    // (fal's own servers do for the https case), so this isn't an SSRF
    // control; it's what keeps generated-image credits tied to content
    // actually produced or uploaded through the product.
    if (typeof imageUrl !== "string" || !(FAL_URL_RE.test(imageUrl) || DATA_URL_RE.test(imageUrl))) {
      return NextResponse.json({ error: "An image is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to generate videos." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    const quality: VideoQuality = rawQuality in VIDEO_TIERS ? rawQuality : "standard";
    const tier = VIDEO_TIERS[quality];

    const isUnlimited = hasUnlimitedCredits(user.email);
    if (!isUnlimited) {
      const plan = await getUserPlan(user.id);
      if (!canUseVideoQuality(plan, quality)) {
        return NextResponse.json({ error: "Upgrade to Pro to unlock Image-to-Video." }, { status: 403 });
      }
    }

    // Fresh uploads need a real URL before fal's queue can use them; a prior
    // generation already has one. Resolved before any credit is charged, so
    // a broken upload never costs the user anything.
    let resolvedImageUrl: string;
    try {
      resolvedImageUrl = DATA_URL_RE.test(imageUrl) ? await uploadDataUrlToFal(imageUrl) : imageUrl;
    } catch (uploadError) {
      console.error("uploadDataUrlToFal failed:", uploadError);
      return NextResponse.json({ error: "Failed to process the uploaded image." }, { status: 400 });
    }

    // Template prompts never reach the browser, so resolve here from the id.
    // Done before charging, same reasoning as the upload above — an invalid
    // template shouldn't cost the user credits.
    const admin = createAdminClient();
    let motionPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
    if (templateId) {
      const { data: tpl } = await admin
        .from("templates")
        .select("prompt")
        .eq("id", templateId)
        .single();
      if (!tpl) {
        return NextResponse.json({ error: "That template no longer exists." }, { status: 400 });
      }
      motionPrompt = resolveTemplatePrompt(
        tpl.prompt,
        typeof placeholderValues === "object" && placeholderValues ? placeholderValues : {},
        motionPrompt
      );
    }
    if (!motionPrompt) motionPrompt = DEFAULT_MOTION_PROMPT;

    const cost = tier.creditCost;
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
      : await chargeCredits(user.id, cost, credits, `Image-to-video (${quality})`);

    const { data: row, error: insertError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "image-to-video",
        status: "pending",
        prompt: motionPrompt,
        input_image_url: resolvedImageUrl,
        credit_cost: cost,
        metadata: { quality, resolution: tier.resolution, durationSeconds: tier.durationSeconds },
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("generations insert failed:", insertError?.message);
      if (!isUnlimited) await refundCredits(user.id, cost, newCredits, "Image-to-video (failed to start)");
      return NextResponse.json({ error: "Failed to start generation. Try again." }, { status: 500 });
    }

    try {
      const { request_id } = await fal.queue.submit(tier.model, {
        input: {
          prompt: motionPrompt,
          image_url: resolvedImageUrl,
          resolution: tier.resolution,
          duration: String(tier.durationSeconds),
          generate_audio: true,
        },
      });

      await admin
        .from("generations")
        .update({ metadata: { quality, resolution: tier.resolution, durationSeconds: tier.durationSeconds, requestId: request_id } })
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
