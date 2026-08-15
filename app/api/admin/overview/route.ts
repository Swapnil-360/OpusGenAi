import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { cachedQuery, CACHE_TAGS, CACHE_TTL } from "@/lib/cache";

// The route handler itself must run per-request (it reads the caller's
// session cookie to check admin access) — matches every other cookie-reading
// route in this app. The Data Cache below is a separate, inner layer around
// just the expensive query, not a substitute for this.
export const dynamic = "force-dynamic";

async function fetchFalBalance(): Promise<{ balance: number; currency: string } | null> {
  const key = process.env.FAL_ADMIN_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.fal.ai/v1/account/billing?expand=credits", {
      headers: { Authorization: `Key ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { balance: data.credits?.current_balance ?? 0, currency: data.credits?.currency ?? "USD" };
  } catch {
    return null;
  }
}

/**
 * Cached because it's genuinely expensive — a full unfiltered scan of every
 * generation ever created, every auth user (up to 1000), plus a network call
 * to fal's own billing API — for a dashboard that only 2 admin accounts ever
 * view. TTL-only invalidation (no mutation hooks): this aggregates activity
 * across every user's every action, so there's no single mutation to hang
 * "the stats changed" off of the way there is for a template edit. A 60s-old
 * admin dashboard is expected, not a correctness bug — nothing in the app
 * reads these numbers back to make a decision.
 */
const getCachedOverview = cachedQuery(
  async () => {
    const admin = createAdminClient();

    const [{ data: profiles, error: profilesError }, { data: authList, error: authError }, { data: generations, error: genError }, falBilling] =
      await Promise.all([
        admin.from("profiles").select("id, full_name, avatar_url, credits, plan, created_at").order("created_at", { ascending: false }),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin.from("generations").select("id, user_id, status, credit_cost, created_at"),
        fetchFalBalance(),
      ]);

    if (profilesError) throw profilesError;
    if (authError) throw authError;
    if (genError) throw genError;

    const authById = new Map((authList?.users ?? []).map((u) => [u.id, u]));
    const genCountById = new Map<string, number>();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let generationsToday = 0;
    let totalCreditsSpent = 0;

    for (const g of generations ?? []) {
      genCountById.set(g.user_id, (genCountById.get(g.user_id) ?? 0) + 1);
      if (new Date(g.created_at) >= todayStart) generationsToday++;
      totalCreditsSpent += g.credit_cost ?? 0;
    }

    const users = (profiles ?? []).map((p) => {
      const authUser = authById.get(p.id);
      return {
        id: p.id,
        name: p.full_name || authUser?.email?.split("@")[0] || "Unknown",
        email: authUser?.email ?? "",
        avatarUrl: p.avatar_url,
        credits: p.credits ?? 0,
        plan: p.plan ?? "free",
        generations: genCountById.get(p.id) ?? 0,
        joined: p.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      };
    });

    const totalCreditsRemaining = users.reduce((a, u) => a + u.credits, 0);

    return {
      stats: {
        totalUsers: users.length,
        totalGenerations: (generations ?? []).length,
        generationsToday,
        totalCreditsRemaining,
        totalCreditsSpent,
        falBalance: falBilling?.balance ?? null,
        falCurrency: falBilling?.currency ?? "USD",
      },
      users,
    };
  },
  ["admin", "overview"],
  { tags: [CACHE_TAGS.adminOverview], revalidateSeconds: CACHE_TTL.adminOverview }
);

export async function GET() {
  // Defense in depth — middleware already gates this path, but never trust
  // that alone for a route reading every user's data.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email || !(ADMIN_EMAILS as readonly string[]).includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const overview = await getCachedOverview();
    return NextResponse.json(overview);
  } catch (e) {
    console.error("Admin overview route error:", e);
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 });
  }
}
