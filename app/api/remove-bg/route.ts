import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserCredits, chargeCredits, hasUnlimitedCredits, UNLIMITED_CREDITS_DISPLAY } from "@/lib/credits";
import { rejectIfBot } from "@/lib/bot-protect";
import { isWithinImageSizeLimit, IMAGE_TOO_LARGE_MESSAGE } from "@/lib/request-limits";

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
    // This image is stored verbatim in the history row's metadata, so an
    // unbounded one would be written straight into Postgres.
    if (!isWithinImageSizeLimit(image)) {
      return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
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

    // Charged before the history row is written: the atomic charge is what
    // actually enforces the balance (the read above only powers the friendly
    // early exit), so a user who loses a concurrent race gets no row either.
    let newCredits: number;
    if (isUnlimited) {
      newCredits = UNLIMITED_CREDITS_DISPLAY;
    } else {
      const charged = await chargeCredits(user.id, CREDIT_COST, "Remove background");
      if (charged === null) {
        return NextResponse.json(
          { error: "You're out of credits. Upgrade your plan to keep generating." },
          { status: 402 }
        );
      }
      newCredits = charged;
    }

    const { error: insertError } = await createAdminClient().from("generations").insert({
      user_id: user.id,
      tool_id: "remove-bg",
      status: "completed",
      prompt: null,
      credit_cost: CREDIT_COST,
      completed_at: new Date().toISOString(),
      metadata: { images: [image] },
    });
    if (insertError) console.error("generations insert failed:", insertError.message);

    return NextResponse.json({ credits: newCredits });
  } catch (err) {
    console.error("remove-bg route error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
