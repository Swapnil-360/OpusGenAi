import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HF_KEY = process.env.HUGGINGFACE_API_KEY!;
const MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_BASE = "https://router.huggingface.co/hf-inference/models";
const CREDIT_COST = 1;

// Map size ratio to closest HF-supported dimensions
const SIZE_MAP: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 512, height: 512 },
  "4:5":  { width: 512, height: 640 },
  "9:16": { width: 576, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "4:3":  { width: 768, height: 576 },
};

// When the user supplies their own product photo, we never let the model redraw the
// product — we only generate the surrounding scene and composite the untouched product
// cutout on top client-side. This suffix nudges FLUX to leave the center empty.
function buildScenePrompt(userPrompt: string): string {
  return `${userPrompt}. Empty professional product-photography backdrop only — no bottles, no packaging, no products, no objects, just a simple flat surface with soft background and lighting. Straight-on eye-level angle, no strong perspective lines or receding surfaces, no busy interior scene, clean seamless composition, high resolution studio quality, negative space in the center where a product will be placed.`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, ratio = "1:1", templateId, mode } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // ── Auth + credit check ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to generate images." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    const credits = profile?.credits ?? 0;
    if (credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    // ── Generate ──
    const dims = SIZE_MAP[ratio] ?? SIZE_MAP["1:1"];
    const isBackgroundOnly = mode === "background";
    const modelInput = isBackgroundOnly ? buildScenePrompt(prompt.trim()) : prompt;

    const res = await fetch(
      `${HF_BASE}/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: modelInput,
          parameters: {
            num_inference_steps: 4,
            width: dims.width,
            height: dims.height,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("HF error:", err);
      return NextResponse.json({ error: "Generation failed", detail: err }, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    const image = `data:${contentType};base64,${base64}`;

    // ── Persist + charge (server-side, so it can't be skipped) ──
    const { data: insertedRow, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        tool_id: "generate",
        status: "completed",
        prompt: prompt.trim(),
        credit_cost: CREDIT_COST,
        completed_at: new Date().toISOString(),
        metadata: {
          images: [image],
          aspectRatio: ratio,
          templateId: templateId ?? undefined,
          productPreserved: isBackgroundOnly || undefined,
        },
      })
      .select("id")
      .single();
    if (insertError) console.error("generations insert failed:", insertError.message);

    const { error: rpcError } = await supabase.rpc("decrement_credits", {
      uid: user.id,
      amount: CREDIT_COST,
    });
    if (rpcError) console.error("decrement_credits failed:", rpcError.message);

    // Transaction log is best-effort (RLS may restrict inserts)
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -CREDIT_COST,
      type: "generation",
      description: "Image generation",
    });
    if (txError) console.error("credit_transactions insert failed:", txError.message);

    const newCredits = rpcError ? credits : Math.max(0, credits - CREDIT_COST);

    return NextResponse.json({ image, credits: newCredits, generationId: insertedRow?.id ?? null });
  } catch (e) {
    console.error("Generate route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
