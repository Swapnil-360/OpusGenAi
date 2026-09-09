import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { polar } from "@/lib/polar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    void req;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, plan, subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.plan === "free" && !profile.stripe_customer_id)) {
      return NextResponse.json(
        {
          error:
            "No active subscription found. Upgrade to a paid plan to manage billing.",
        },
        { status: 400 },
      );
    }

    // Try creating customer session by Polar customerId, or by externalCustomerId (user.id)
    const session = profile.stripe_customer_id
      ? await polar.customerSessions.create({
          customerId: profile.stripe_customer_id,
        })
      : await polar.customerSessions.create({
          externalCustomerId: user.id,
        });

    if (!session || !session.customerPortalUrl) {
      return NextResponse.json(
        { error: "Could not open customer billing portal." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.customerPortalUrl });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : "Internal error";
    console.error("Polar customer portal error:", error);
    return NextResponse.json(
      { error: `Billing portal error: ${errMessage}` },
      { status: 500 },
    );
  }
}
