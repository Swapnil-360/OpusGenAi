import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, resolveProductIdFromPlan } from "@/lib/polar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body.plan;

    if (plan !== "basic" && plan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'basic' or 'pro'." },
        { status: 400 },
      );
    }

    const productId = resolveProductIdFromPlan(plan);
    if (!productId) {
      console.error(
        `Missing Polar product ID for plan '${plan}'. Please set POLAR_${plan.toUpperCase()}_PRODUCT_ID in environment variables.`,
      );
      return NextResponse.json(
        {
          error:
            "Checkout is currently being configured. Please check back shortly.",
        },
        { status: 503 },
      );
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email,
      externalCustomerId: user.id,
      metadata: {
        userId: user.id,
        plan,
      },
      successUrl: `${origin}/account?checkout=success`,
      returnUrl: `${origin}/account`,
    });

    if (!checkout || !checkout.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal error";
    console.error("Polar checkout session creation error:", error);
    return NextResponse.json(
      { error: `Checkout error: ${errMessage}` },
      { status: 500 },
    );
  }
}
