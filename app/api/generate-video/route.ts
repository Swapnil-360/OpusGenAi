import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits, refundCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { getUserPlan } from "@/lib/entitlements";
import { VIDEO_TIERS, canUseVideoQuality, canUseMultiImageVideo, hasReachedBasicVideoLimit, BASIC_STANDARD_VIDEO_LIMIT, MULTI_IMAGE_VIDEO_TIER, type VideoQuality } from "@/lib/plans";
import { resolveTemplatePrompt } from "@/lib/template-prompt";
import { rejectIfBot } from "@/lib/bot-protect";
import { failAndRefundOnce } from "@/lib/video-status";
import {
  sanitizePrompt,
  sanitizePlaceholderValues,
  isWithinImageSizeLimit,
  IMAGE_TOO_LARGE_MESSAGE,
} from "@/lib/request-limits";

const DEFAULT_MOTION_PROMPT = "smooth cinematic camera motion, subtle zoom, natural movement";
const DATA_URL_RE = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
const FAL_URL_RE = /^https:\/\/[^/]*fal\.(media|ai|run)\//;

// One below MULTI_IMAGE_VIDEO_TIER.maxImages — the main image always takes
// the first slot, so this is how many more the client can attach.
const MAX_EXTRA_IMAGES = MULTI_IMAGE_VIDEO_TIER.maxImages - 1;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, extraImageUrls: rawExtraImageUrls, prompt: userPrompt, templateId, placeholderValues, quality: rawQuality } = await req.json();

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
    if (!isWithinImageSizeLimit(imageUrl)) {
      return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
    }

    // Reference photos beyond the main one — validated the same way, then
    // capped server-side rather than trusting the client's own MAX_EXTRA
    // limit. 0 extras is the common case and behaves exactly as before this
    // feature existed; the array's presence, not just its length, decides
    // whether this job uses the single-image models or MULTI_IMAGE_VIDEO_TIER.
    const extraImageUrls: string[] = Array.isArray(rawExtraImageUrls)
      ? rawExtraImageUrls
          .filter(
            (u): u is string =>
              typeof u === "string" &&
              (FAL_URL_RE.test(u) || DATA_URL_RE.test(u)) &&
              isWithinImageSizeLimit(u)
          )
          .slice(0, MAX_EXTRA_IMAGES)
      : [];
    const isMultiImage = extraImageUrls.length > 0;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to generate videos." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    // Multi-image jobs always use MULTI_IMAGE_VIDEO_TIER's fixed model/price —
    // the client's quality field is only meaningful for the single-image path,
    // same "server decides, never the client" rule as everywhere else.
    const quality: VideoQuality = rawQuality in VIDEO_TIERS ? rawQuality : "standard";
    const tier = isMultiImage ? MULTI_IMAGE_VIDEO_TIER : VIDEO_TIERS[quality];

    const isUnlimited = hasUnlimitedCredits(user.email);
    const admin = createAdminClient();

    if (!isUnlimited) {
      const plan = await getUserPlan(user.id);
      const entitled = isMultiImage ? canUseMultiImageVideo(plan) : canUseVideoQuality(plan, quality);
      if (!entitled) {
        return NextResponse.json({ error: "Upgrade to Pro to unlock Image-to-Video." }, { status: 403 });
      }

      // Basic's video access is Standard-quality only, capped — HD, Premium,
      // and multi-image all stay Pro-only via the minPlan check above, so
      // this only ever applies to the one tier Basic can actually reach.
      if (!isMultiImage && quality === "standard" && plan === "basic") {
        const { count } = await admin
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("tool_id", "image-to-video")
          .in("status", ["completed", "pending"])
          .eq("metadata->>quality", "standard");
        if (hasReachedBasicVideoLimit(plan, count ?? 0)) {
          return NextResponse.json(
            { error: `You've used all ${BASIC_STANDARD_VIDEO_LIMIT} videos included with Basic. Upgrade to Pro for unlimited video.` },
            { status: 403 }
          );
        }
      }
    }

    // Fresh uploads need a real URL before fal's queue can use them; a prior
    // generation already has one. Resolved before any credit is charged, so
    // a broken upload never costs the user anything.
    let resolvedImageUrls: string[];
    try {
      resolvedImageUrls = await Promise.all(
        [imageUrl, ...extraImageUrls].map((u) => (DATA_URL_RE.test(u) ? uploadDataUrlToFal(u) : u))
      );
    } catch (uploadError) {
      console.error("uploadDataUrlToFal failed:", uploadError);
      return NextResponse.json({ error: "Failed to process the uploaded image." }, { status: 400 });
    }
    const resolvedImageUrl = resolvedImageUrls[0];

    // Template prompts never reach the browser, so resolve here from the id.
    // Done before charging, same reasoning as the upload above — an invalid
    // template shouldn't cost the user credits.
    let motionPrompt = sanitizePrompt(userPrompt);
    if (templateId) {
      if (typeof templateId !== "string") {
        return NextResponse.json({ error: "Invalid template." }, { status: 400 });
      }
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
        sanitizePlaceholderValues(placeholderValues),
        motionPrompt
      );
    }
    if (!motionPrompt) motionPrompt = DEFAULT_MOTION_PROMPT;

    // reference-to-video needs each image explicitly mapped via @ImageN or it
    // may only loosely use them. A template's own prompt is expected to
    // already do this (the admin authors it against the slots they defined),
    // so this is only a fallback for freeform multi-image jobs — and a safety
    // net if a template prompt ever forgets it.
    if (isMultiImage && !/@Image\d/.test(motionPrompt)) {
      const mapping = resolvedImageUrls
        .map((_, i) => (i === 0 ? "@Image1 is the main photo." : `@Image${i + 1} is an additional reference photo the user provided.`))
        .join(" ");
      motionPrompt = `${motionPrompt} Reference images: ${mapping}`;
    }

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
    //
    // This charge is also the real balance enforcement: it deducts only if
    // the balance still covers the cost at that instant, so two requests
    // fired together can't both clear the earlier read-only check and both
    // get a video.
    let newCredits: number;
    if (isUnlimited) {
      newCredits = UNLIMITED_CREDITS_DISPLAY;
    } else {
      const charged = await chargeCredits(
        user.id,
        cost,
        isMultiImage ? "Image-to-video (multi-image)" : `Image-to-video (${quality})`
      );
      if (charged === null) {
        return NextResponse.json(
          { error: "You're out of credits. Upgrade your plan to keep generating." },
          { status: 402 }
        );
      }
      newCredits = charged;
    }

    // metadata.quality stays a real VideoQuality for single-image rows (so old
    // rows and the status route's fallback keep working unchanged) and becomes
    // "multi" for these — metadata.model is what the status route actually
    // uses to resolve the fal model going forward, so it doesn't need a
    // VIDEO_TIERS-shaped lookup key for a tier that isn't in that record.
    const baseMetadata = {
      quality: isMultiImage ? "multi" : quality,
      model: tier.model,
      resolution: tier.resolution,
      durationSeconds: tier.durationSeconds,
      imageCount: resolvedImageUrls.length,
    };

    const { data: row, error: insertError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "image-to-video",
        status: "pending",
        prompt: motionPrompt,
        input_image_url: resolvedImageUrl,
        credit_cost: cost,
        metadata: baseMetadata,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("generations insert failed:", insertError?.message);
      // No row was created, so there is nothing for the settle path to claim
      // later — this refund can't collide with one.
      if (!isUnlimited) await refundCredits(user.id, cost, "Image-to-video (failed to start)");
      return NextResponse.json({ error: "Failed to start generation. Try again." }, { status: 500 });
    }

    try {
      const { request_id } = await fal.queue.submit(tier.model, {
        input: isMultiImage
          ? {
              prompt: motionPrompt,
              image_urls: resolvedImageUrls,
              resolution: tier.resolution,
              duration: String(tier.durationSeconds),
              generate_audio: true,
            }
          : {
              prompt: motionPrompt,
              image_url: resolvedImageUrl,
              resolution: tier.resolution,
              duration: String(tier.durationSeconds),
              generate_audio: true,
            },
      });

      await admin
        .from("generations")
        .update({ metadata: { ...baseMetadata, requestId: request_id } })
        .eq("id", row.id);

      return NextResponse.json({ generationId: row.id, credits: newCredits });
    } catch (submitError) {
      console.error("fal.queue.submit failed:", submitError);
      // Marks failed and refunds as one claimed transition, so this can't
      // double-refund against a settle pass that saw the row first.
      const refunded = await failAndRefundOnce(
        admin,
        { id: row.id, user_id: user.id, status: "pending", error_message: null, credit_cost: cost, metadata: baseMetadata },
        user.email,
        "Failed to start video generation.",
        "Image-to-video (submit failed)"
      );
      return NextResponse.json(
        { error: "Failed to start video generation.", credits: refunded ?? newCredits },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("generate-video route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
