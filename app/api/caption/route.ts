import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal, uploadDataUrlToFal } from "@/lib/fal";

const SYSTEM_PROMPT =
  "You are an expert social media copywriter. Look at the photo and write captions for what it actually " +
  "shows — a product, a person/portrait, a scene, whatever it is. Don't assume it's a product shot unless it is one.";

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, platform = "instagram", tone = "Casual" } = await req.json();

    if (!prompt?.trim() && !image) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Auth required (prevents anonymous abuse) — no credit charge, this is a free tool.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    // History images are already hosted (a real https URL) — pass through as-is.
    // A freshly uploaded file arrives as a data: URL and needs fal's own storage first.
    const imageUrls: string[] = [];
    if (image) {
      imageUrls.push(typeof image === "string" && image.startsWith("data:") ? await uploadDataUrlToFal(image) : image);
    }

    const context = prompt?.trim() ? `\n\nAdditional context (product/subject name, if relevant): "${prompt.trim()}"` : "";
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
