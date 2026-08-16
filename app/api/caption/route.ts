import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";
import { rejectIfBot } from "@/lib/bot-protect";
import { rejectIfRateLimited, AI_ASSIST_LIMIT } from "@/lib/rate-limit";
import { sanitizePrompt, isWithinImageSizeLimit, IMAGE_TOO_LARGE_MESSAGE } from "@/lib/request-limits";

const SYSTEM_PROMPT =
  "You are an expert social media copywriter. Look at the photo and write captions for what it actually " +
  "shows — a product, a person/portrait, a scene, whatever it is. Don't assume it's a product shot unless it is one.";

export async function POST(req: NextRequest) {
  try {
    const { prompt: rawPrompt, image, platform = "instagram", tone = "Casual" } = await req.json();

    // Capped before use: interpolated into the instruction below, and this
    // call is billed per token.
    const prompt = sanitizePrompt(rawPrompt, 2000);

    if (!prompt && !image) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (typeof image === "string" && !isWithinImageSizeLimit(image)) {
      return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
    }

    // Auth required (prevents anonymous abuse) — no credit charge, this is a free tool.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    // Costs real money per call but deducts no credits, so the credit system
    // isn't bounding it — this is what stops an unbounded loop.
    const limited = await rejectIfRateLimited(user.id, AI_ASSIST_LIMIT);
    if (limited) return limited;

    // History images are already hosted (a real https URL) — pass through as-is.
    // A freshly uploaded file arrives as a data: URL and needs fal's own storage first.
    const imageUrls: string[] = [];
    if (image) {
      imageUrls.push(typeof image === "string" && image.startsWith("data:") ? await uploadDataUrlToFal(image) : image);
    }

    const context = prompt ? `\n\nAdditional context (product/subject name, if relevant): "${prompt}"` : "";
    const instruction = `Write 2 different ${platform} captions for this photo.${context}

Tone: ${tone}
Requirements: platform-native style, include relevant emojis where fitting, no hashtags inside the captions.

Return in EXACTLY this format, nothing else:
CAPTION 1: <first caption>
CAPTION 2: <second caption>
HASHTAGS: <8-15 relevant hashtags, space-separated, each starting with #>`;

    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: imageUrls,
        prompt: instruction,
        system_prompt: SYSTEM_PROMPT,
        model: "google/gemini-2.5-flash",
        temperature: 0.8,
        max_tokens: 800,
      },
    });

    const text = ((result.data as { output?: string })?.output ?? "").trim();
    if (!text) {
      console.error("fal caption returned no output:", result);
      return NextResponse.json({ error: "Caption generation failed" }, { status: 502 });
    }

    const captionMatches = [...text.matchAll(/CAPTION \d+:\s*([\s\S]*?)(?=\nCAPTION \d+:|\nHASHTAGS:|$)/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);

    const hashtagsMatch = text.match(/HASHTAGS:\s*([\s\S]*)$/);
    const hashtags = hashtagsMatch
      ? hashtagsMatch[1].match(/#\w+/g) ?? []
      : [];

    const captions = captionMatches.length ? captionMatches : [text.trim()];

    return NextResponse.json({ captions, hashtags });
  } catch (e) {
    console.error("Caption route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
