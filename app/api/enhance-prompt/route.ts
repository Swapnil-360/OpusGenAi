import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { rejectIfBot } from "@/lib/bot-protect";

const SYSTEM_PROMPT =
  "You are a professional product photography art director for an e-commerce AI image generator. " +
  "Respond with ONLY the improved prompt text — no explanations, no quotes, no markdown, no prefix. Keep it under 60 words.";

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, hasProductPhoto } = await req.json();

    if (!prompt?.trim() && !image) {
      return NextResponse.json({ error: "Add a photo or prompt first." }, { status: 400 });
    }

    // Auth required (prevents anonymous abuse) — no credit charge, this call costs ~$0.001.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    const imageUrls: string[] = [];
    if (image) {
      imageUrls.push(await uploadDataUrlToFal(image));
    }

    let instruction: string;
    if (image && prompt?.trim()) {
      instruction = `Analyze this product photo. Improve and refine this scene description for professional e-commerce product photography — keep the user's intent but add specific, effective photography details (surface, lighting, mood): "${prompt.trim()}"`;
    } else if (image) {
      instruction = hasProductPhoto
        ? "Analyze this product photo and write a professional scene description only (surface, lighting, mood, props) for a premium e-commerce product photo. Do not describe the product itself, only the environment around it."
        : "Analyze this product photo and write a professional full product-photography prompt describing the product and an ideal scene (surface, lighting, mood) for an e-commerce listing.";
    } else {
      instruction = `Improve this product photography prompt to be more specific and professional, adding details about lighting, surface, and mood while keeping the original subject: "${prompt.trim()}"`;
    }

    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: imageUrls,
        prompt: instruction,
        system_prompt: SYSTEM_PROMPT,
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        max_tokens: 150,
      },
    });

    const output = (result.data as { output?: string })?.output?.trim();
    if (!output) {
      return NextResponse.json({ error: "Couldn't improve the prompt. Try again." }, { status: 502 });
    }

    return NextResponse.json({ prompt: output });
  } catch (e) {
    console.error("Enhance prompt route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
