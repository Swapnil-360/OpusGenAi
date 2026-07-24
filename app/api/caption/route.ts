import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HF_KEY = process.env.HUGGINGFACE_API_KEY!;
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const MODEL = "HuggingFaceH4/zephyr-7b-beta";

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

    const input = `<|system|>You are an expert social media copywriter for product photography.</s>
<|user|>Write 2 different ${platform} captions for a product photo described as: "${prompt}"

Tone: ${tone}
Requirements: platform-native style, include relevant emojis where fitting, no hashtags inside the captions.

Return in EXACTLY this format, nothing else:
CAPTION 1: <first caption>
CAPTION 2: <second caption>
HASHTAGS: <8-15 relevant hashtags, space-separated, each starting with #></s>
<|assistant|>`;

    const res = await fetch(`${HF_BASE}/${MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_KEY}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
      },
      body: JSON.stringify({
        inputs: input,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.8,
          return_full_text: false,
          stop: ["<|user|>", "</s>"],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("HF caption error:", err);
      return NextResponse.json({ error: "Caption generation failed", detail: err }, { status: res.status });
    }

    const data = await res.json();
    const text: string = Array.isArray(data) ? data[0]?.generated_text ?? "" : data?.generated_text ?? "";

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
