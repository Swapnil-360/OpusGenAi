import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserCredits, chargeCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { rejectIfBot } from "@/lib/bot-protect";

const CREDIT_COST = 1;

// The actual background removal runs client-side (@imgly/background-removal,
// WASM) — no AI API call happens here. This route exists solely to charge
// the credit the UI has always advertised and to record the result in
// history, matching every other tool instead of silently costing nothing.
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this tool." }, { status: 401 });
    }

    const botResponse = await rejectIfBot();
    if (botResponse) return botResponse;

    const isUnlimited = hasUnlimitedCredits(user.email);
    const credits = await getUserCredits(user.id);
    if (!isUnlimited && credits < CREDIT_COST) {
      return NextResponse.json(
        { error: "You're out of credits. Upgrade your plan to keep generating." },
        { status: 402 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert({
      user_id: user.id,
      tool_id: "remove-bg",
      status: "completed",
      prompt: null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [image] },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    const newCredits = isUnlimited
      ? UNLIMITED_CREDITS_DISPLAY
      : await chargeCredits(user.id, CREDIT_COST, credits, "Remove background");

    return NextResponse.json({ credits: newCredits });
  } catch (err) {
    console.error("remove-bg route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
