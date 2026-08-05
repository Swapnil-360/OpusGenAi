import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/admin-config";

export const dynamic = "force-dynamic";

/**
 * Everything the dashboard chrome and account page need to render, in one
 * server round trip.
 *
 * The client used to do this itself: getSession() (which, on a returning visit
 * with an expired access token, blocks on a navigator.locks-guarded refresh),
 * then a profiles query, a generations count, and a separate /api/admin/check —
 * a serial waterfall that left the sidebar on "Loading…" and the account page
 * showing placeholder values. Middleware has already validated and refreshed
 * the session cookie by the time this handler runs, so there is no client-side
 * token refresh to wait on.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const [{ data: profile }, { count }, prefsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, credits, avatar_url").eq("id", user.id).single(),
    supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    // Kept as its own query: an older schema without this column shouldn't
    // take the rest of the profile down with it.
    supabase.from("profiles").select("notification_prefs").eq("id", user.id).single(),
  ]);

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;

  return NextResponse.json({
    id: user.id,
    email: user.email ?? "",
    name:
      profile?.full_name ||
      meta.full_name ||
      meta.name ||
      user.email?.split("@")[0] ||
      "User",
    avatarUrl: profile?.avatar_url || meta.avatar_url || meta.picture || null,
    credits: typeof profile?.credits === "number" ? profile.credits : 0,
    totalGenerations: count ?? 0,
    isAdmin: !!user.email && (ADMIN_EMAILS as readonly string[]).includes(user.email.toLowerCase()),
    notificationPrefs: prefsResult.data?.notification_prefs ?? null,
  });
}
