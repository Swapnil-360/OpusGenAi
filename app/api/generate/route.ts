import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTemplatePrompt } from "@/lib/template-prompt";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { getUserCredits, chargeCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { getUserPlan } from "@/lib/entitlements";
import { QUALITY_TIERS, canUseQuality, type Quality } from "@/lib/plans";
import { buildScenePrompt, buildProductEditPrompt, buildPortraitEditPrompt, buildCampaignEditPrompt, HF_SIZE_MAP as SIZE_MAP } from "@/lib/scene-prompt";
import { rejectIfBot } from "@/lib/bot-protect";
import {
  sanitizePrompt,
  sanitizePlaceholderValues,
  isWithinImageSizeLimit,
  IMAGE_TOO_LARGE_MESSAGE,
} from "@/lib/request-limits";

const CREDIT_COST = 1;

// Valid aspect ratios for the premium edit models — our SIZE_MAP keys
// (1:1, 4:5, 9:16, 16:9, 4:3) are all supported natively, no mapping needed.

export async function POST(req: NextRequest) {
  try {
    const {
      prompt: userPrompt = "",
      ratio = "1:1",
      templateId,
      templateType: rawTemplateType,
      placeholderValues,
      mode,
      image: inputImage,
      quality: rawQuality,
    } = await req.json();

    // ── Auth + credit check ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to generate images." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    // The template's prompt is never sent to the browser (the column is
    // revoked from anon and authenticated alike) — it's looked up here from
    // the id, placeholders filled from the user's answers, and whatever extra
    // direction they typed appended. Without a template, the user's own text
    // is the whole prompt.
    const cleanUserPrompt = sanitizePrompt(userPrompt);
    let prompt = cleanUserPrompt;
    let templateType = rawTemplateType;
    if (templateId) {
      if (typeof templateId !== "string") {
        return NextResponse.json({ error: "Invalid template." }, { status: 400 });
      }
      const admin = createAdminClient();
      const { data: tpl } = await admin
        .from("templates")
        .select("prompt, template_type")
        .eq("id", templateId)
        .single();
      if (!tpl) {
        return NextResponse.json({ error: "That template no longer exists." }, { status: 400 });
      }
      // Trusted from the row, not the request — a client can't relabel a
      // template to get a different prompt-fidelity suffix applied.
      templateType = tpl.template_type;
      prompt = resolveTemplatePrompt(
        tpl.prompt,
        sanitizePlaceholderValues(placeholderValues),
        cleanUserPrompt
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const isPremium = mode === "premium";
    // Quality only applies to the premium (image-preserving edit) path —
    // the free flux/schnell path has no quality ladder. Default to
    // "standard" so existing clients that don't send `quality` keep
    // behaving exactly as before.
    const quality: Quality = isPremium && rawQuality in QUALITY_TIERS ? rawQuality : "standard";
    const tier = QUALITY_TIERS[quality];
    const cost = isPremium ? tier.creditCost : CREDIT_COST;

    const isUnlimited = hasUnlimitedCredits(user.email);

    if (isPremium && !isUnlimited) {
      const plan = await getUserPlan(user.id);
      if (!canUseQuality(plan, quality)) {
        return NextResponse.json(
          { error: `Upgrade to ${tier.minPlan === "basic" ? "Basic" : "Pro"} to use ${quality.toUpperCase()} quality.` },
          { status: 403 }
        );
      }
    }

    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < cost) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    let image: string | undefined;

    if (isPremium) {
      if (!inputImage || typeof inputImage !== "string") {
        return NextResponse.json({ error: "Product photo is required for this mode." }, { status: 400 });
      }
      if (!isWithinImageSizeLimit(inputImage)) {
        return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
      }
      const imageUrl = await uploadDataUrlToFal(inputImage);
      const editPrompt =
        templateType === "universal" ? buildPortraitEditPrompt(prompt.trim())
        : templateType === "campaign" ? buildCampaignEditPrompt(prompt.trim())
        : buildProductEditPrompt(prompt.trim());
      const result = await fal.subscribe(tier.model, {
        input: {
          image_urls: [imageUrl],
          prompt: editPrompt,
          aspect_ratio: ratio,
          num_images: 1,
          output_format: "png",
          ...(tier.resolution ? { resolution: tier.resolution } : {}),
        },
      });
      image = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
      if (!image) {
        console.error(`fal ${tier.model} returned no image:`, result);
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

    // ── Charge first, then persist ──
    // The charge is atomic and conditional (see chargeCredits): it is what
    // actually enforces the balance, not the read above. Ordering it before
    // the insert means a user who ran out mid-flight can't end up with a
    // generation row that was never paid for.
    let newCredits: number;
    if (isUnlimited) {
      newCredits = UNLIMITED_CREDITS_DISPLAY;
    } else {
      const charged = await chargeCredits(
        user.id,
        cost,
        isPremium ? `Premium AI product photo (${quality})` : "Image generation"
      );
      if (charged === null) {
        return NextResponse.json(
          { error: "You're out of credits. Upgrade your plan to keep generating." },
          { status: 402 }
        );
      }
      newCredits = charged;
    }

    // Written with the service-role client, like every other generation write.
    // The session client depended on an RLS grant for the `authenticated`
    // role that this app has already had silently break once (see the note in
    // lib/credits.ts), which failed the insert without failing the request —
    // the user got their image but no history row.
    const { data: insertedRow, error: insertError } = await createAdminClient()
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
          templateType: templateType ?? undefined,
          productPreserved: mode === "background" || undefined,
          engine: isPremium ? tier.model : undefined,
          quality: isPremium ? quality : undefined,
        },
      })
      .select("id")
      .single();
    if (insertError) console.error("generations insert failed:", insertError.message);

    return NextResponse.json({ image, credits: newCredits, generationId: insertedRow?.id ?? null });
  } catch (e) {
    console.error("Generate route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
