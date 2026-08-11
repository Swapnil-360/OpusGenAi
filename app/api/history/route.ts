import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Single server round trip for the History page, same reasoning as /api/me:
 * the browser client's supabase.auth.getUser() re-validates the JWT against
 * Supabase Auth over the network (unlike getSession(), which just reads the
 * local cookie) and queues behind a navigator.locks-guarded token refresh —
 * right after a fresh login that refresh is often actually in flight, so a
 * client-side getUser() + table query could stall for seconds while the page
 * silently showed "No generations found" (empty state and "still loading"
 * were indistinguishable — no separate loading flag existed).
 *
 * Middleware has already validated/refreshed the session cookie by the time
 * this handler runs, so this never waits on a client-side refresh.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generations")
    .select("id, prompt, status, metadata, credit_cost, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("history route error:", error.message);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }

  return NextResponse.json({ generations: data ?? [] });
}
