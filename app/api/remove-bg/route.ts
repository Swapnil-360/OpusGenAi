import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HF_KEY = process.env.HUGGINGFACE_API_KEY!;
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const MODEL = "briaai/RMBG-1.4";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // Auth required (prevents anonymous abuse) — no credit charge, this is a free tool.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)." }, { status: 413 });
    }

    const imageBytes = await file.arrayBuffer();

    const res = await fetch(`${HF_BASE}/${MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_KEY}`,
        "Content-Type": file.type || "image/jpeg",
        "x-wait-for-model": "true",
      },
      body: imageBytes,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("HF remove-bg error:", errText);
      return NextResponse.json({ error: "Background removal failed. Try again." }, { status: 502 });
    }

    const resultBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";

    return NextResponse.json({ image: `data:${contentType};base64,${base64}` });
  } catch (err) {
    console.error("remove-bg route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
