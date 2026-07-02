import { NextRequest, NextResponse } from "next/server";

const HF_KEY = process.env.HUGGINGFACE_API_KEY!;
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const MODEL = "caidas/swin2SR-realworld-sr-x4-large";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
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

    return NextResponse.json({ image: `data:${contentType};base64,${base64}` });
  } catch (err) {
    console.error("upscale route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
