import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Per-user rate limiting for endpoints that cost real money but charge no
 * credits.
 *
 * The credit system is this app's main abuse control, and for anything that
 * deducts credits it is enough on its own. Three endpoints don't deduct
 * anything — the two prompt writers and the caption generator — because each
 * call is only a fraction of a cent. Individually cheap, but nothing bounded
 * how many a signed-in account could make: a free account with zero credits
 * could still call them in a loop indefinitely.
 *
 * Counting happens in Postgres (see the consume_rate_limit function), not in
 * process memory, because these run as serverless functions where a local
 * counter would be per-instance and effectively meaningless.
 */

export interface RateLimitRule {
  /** Distinct bucket name, so two endpoints don't share a budget. */
  name: string;
  max: number;
  windowSeconds: number;
}

/** Prompt writing and captioning: bursty by nature (users retry a few times to
 *  get wording they like), so the window is generous enough not to interrupt
 *  real use while still capping a runaway loop. */
export const AI_ASSIST_LIMIT: RateLimitRule = { name: "ai-assist", max: 30, windowSeconds: 60 * 5 };

/**
 * Returns a 429 response when the caller is over their limit, or null to
 * proceed — same shape as rejectIfBot(), so route code reads the same way.
 *
 * Fails open: if the limiter itself errors (Supabase hiccup, migration not yet
 * applied), the request is allowed through. A rate limiter is a safeguard
 * against abuse, and taking working endpoints down when the safeguard is
 * unavailable would be the worse failure.
 */
export async function rejectIfRateLimited(
  userId: string,
  rule: RateLimitRule
): Promise<NextResponse | null> {
  try {
    const admin = createAdminClient();
    const { data: allowed, error } = await admin.rpc("consume_rate_limit", {
      k: `${rule.name}:${userId}`,
      max_calls: rule.max,
      window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error("consume_rate_limit failed (allowing request):", error.message);
      return null;
    }

    if (allowed === false) {
      return NextResponse.json(
        { error: "You're doing that a lot — give it a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rule.windowSeconds) } }
      );
    }
    return null;
  } catch (err) {
    console.error("rate limit check threw (allowing request):", err);
    return null;
  }
}
