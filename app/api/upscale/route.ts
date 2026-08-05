import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserCredits, chargeCredits, hasUnlimitedCredits } from "@/lib/credits";

const HF_KEY = process.env.HUGGINGFACE_API_KEY!;
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const MODEL = "caidas/swin2SR-realworld-sr-x4-large";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CREDIT_COST = 2;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    // The tool UI has always advertised "2 credits" (ToolPageShell, the
    // upscale button label) — this just makes the charge match what was
    // already promised instead of silently charging nothing.
    const isUnlimited = hasUnlimitedCredits(user.email);
    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
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
      console.error("HF upscale error:", errText);
      return NextResponse.json({ error: "Upscale failed. Try again." }, { status: 502 });
    }

    const resultBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    const image = `data:${contentType};base64,${base64}`;

    const { error: insertError } = await supabase.from("generations").insert({
      user_id: user.id,
      tool_id: "upscale",
      status: "completed",
      prompt: null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [image] },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = isUnlimited
      ? credits
      : await chargeCredits(user.id, CREDIT_COST, credits, "Upscale 4×");

    return NextResponse.json({ image, credits: newCredits });
  } catch (err) {
    console.error("upscale route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
