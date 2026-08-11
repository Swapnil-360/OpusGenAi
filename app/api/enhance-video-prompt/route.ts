import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { rejectIfBot } from "@/lib/bot-protect";

const SYSTEM_PROMPT =
  "You are a senior creative director at a premium ad agency, writing production-ready prompts for " +
  "an AI image-to-video model that will generate a commercial product advertisement. Given a product " +
  "photo and the client's chosen style and camera movement, write ONE detailed cinematic video prompt " +
  "at the same depth and polish as a real creative brief — not a short caption. It must, in flowing " +
  "prose (not bullet points or headers): open with the specific opening shot and composition; describe " +
  "exactly how the camera moves and paces through the shot; describe the lighting, atmosphere, color " +
  "palette, and background/surface in detail, matching the chosen style; explicitly instruct that the " +
  "product's exact shape, color, proportions, branding, logo, and any visible text must be preserved " +
  "with zero distortion, duplication, morphing, or warping; explicitly state there must be no people, " +
  "hands, extra products, or added text/logos; and close with a technical quality line such as " +
  "'photorealistic, premium studio lighting, shallow depth of field, high-end commercial cinematography'. " +
  "Write 130–180 words as one continuous paragraph. Respond with ONLY the prompt text — no headers, " +
  "no markdown, no explanations, no quotes, no prefix like 'Prompt:'.";

const DATA_URL_RE = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
const FAL_URL_RE = /^https:\/\/[^/]*fal\.(media|ai|run)\//;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, style, movement, hint } = await req.json();

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

    const styleText = typeof style === "string" && style.trim() ? style.trim() : "Luxury / Premium";
    const movementText = typeof movement === "string" && movement.trim() ? movement.trim() : "Slow Push-In";

    let instruction =
      `Write a production-ready cinematic video prompt for this exact product. ` +
      `Style: ${styleText}. Camera movement: ${movementText}.`;
    if (typeof hint === "string" && hint.trim()) {
      instruction += ` Additional creative direction from the client: "${hint.trim()}"`;
    }

    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: [resolvedUrl],
        prompt: instruction,
        system_prompt: SYSTEM_PROMPT,
        model: "google/gemini-2.5-flash",
        temperature: 0.75,
        max_tokens: 420,
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
