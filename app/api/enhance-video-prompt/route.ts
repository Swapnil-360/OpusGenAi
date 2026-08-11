import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { rejectIfBot } from "@/lib/bot-protect";

const SYSTEM_PROMPT =
  "You are a professional creative director for premium commercial product-video advertisements. " +
  "Given a product photo, write ONE cinematic motion prompt for an AI image-to-video model that " +
  "describes camera movement (e.g. slow push-in, orbit, pull-back, parallax), lighting, atmosphere, " +
  "and mood suited to the specific product shown. Always explicitly instruct the model to preserve " +
  "the product's exact shape, color, branding, logo, and any visible text with zero distortion, " +
  "duplication, morphing, or alteration, and to include no people, hands, or added text overlays. " +
  "Respond with ONLY the motion prompt text — no explanations, no markdown, no prefix, no quotes. " +
  "Keep it under 90 words.";

const DATA_URL_RE = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
const FAL_URL_RE = /^https:\/\/[^/]*fal\.(media|ai|run)\//;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, hint } = await req.json();

    if (typeof imageUrl !== "string" || !(FAL_URL_RE.test(imageUrl) || DATA_URL_RE.test(imageUrl))) {
      return NextResponse.json({ error: "An image is required." }, { status: 400 });
    }

    // Auth required (prevents anonymous abuse) — no credit charge, this call
    // costs ~$0.001, same reasoning as /api/enhance-prompt.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    const resolvedUrl = DATA_URL_RE.test(imageUrl) ? await uploadDataUrlToFal(imageUrl) : imageUrl;

    const instruction = typeof hint === "string" && hint.trim()
      ? `Write a professional cinematic video motion prompt for this exact product, incorporating this creative direction: "${hint.trim()}"`
      : "Analyze this product photo and write a professional cinematic video motion prompt suited to this exact product.";

    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: [resolvedUrl],
        prompt: instruction,
        system_prompt: SYSTEM_PROMPT,
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        max_tokens: 220,
      },
    });

    const output = (result.data as { output?: string })?.output?.trim();
    if (!output) {
      return NextResponse.json({ error: "Couldn't generate a prompt. Try again." }, { status: 502 });
    }

    return NextResponse.json({ prompt: output });
  } catch (e) {
    console.error("Enhance video prompt route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
