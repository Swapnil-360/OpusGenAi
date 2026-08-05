import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fal } from "@/lib/fal";

const SYSTEM_PROMPT = "You are an expert social media copywriter for product photography.";

export async function POST(req: NextRequest) {
  try {
    const { prompt, platform = "instagram", tone = "Casual" } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Auth required (prevents anonymous abuse) — no credit charge, this is a free tool.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const instruction = `Write 2 different ${platform} captions for a product photo described as: "${prompt}"

Tone: ${tone}
Requirements: platform-native style, include relevant emojis where fitting, no hashtags inside the captions.

Return in EXACTLY this format, nothing else:
CAPTION 1: <first caption>
CAPTION 2: <second caption>
HASHTAGS: <8-15 relevant hashtags, space-separated, each starting with #>`;

    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        image_urls: [],
        prompt: instruction,
        system_prompt: SYSTEM_PROMPT,
        model: "google/gemini-2.5-flash",
        temperature: 0.8,
        max_tokens: 400,
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
