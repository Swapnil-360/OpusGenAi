import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { settlePendingVideoRow } from "@/lib/video-status";

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
    .select("id, tool_id, prompt, status, metadata, credit_cost, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("history route error:", error.message);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }

  const rows = data ?? [];

  // A video generation's completion is otherwise only ever detected as a
  // side effect of the live status-poll route running while the generator
  // page stays open — close the tab, and fal finishes the job regardless,
  // but nothing ever tells our own `generations` row. Reconciling any still-
  // pending video rows right here means simply reopening the app (landing on
  // History, or any page that loads it) is what surfaces a result the user
  // walked away from, not something they had to know to go check for.
  const pendingVideoRows = rows.filter((r) => r.tool_id === "image-to-video" && r.status === "pending");
  if (pendingVideoRows.length > 0) {
    const admin = createAdminClient();
    const settledById = new Map(
      await Promise.all(
        pendingVideoRows.map(async (row) => {
          const settled = await settlePendingVideoRow(admin, { ...row, user_id: user.id }, user.email);
          return [row.id, settled] as const;
        })
      )
    );
    for (const row of rows) {
      const settled = settledById.get(row.id);
      if (!settled || settled.status === "pending") continue;
      row.status = settled.status;
      if (settled.status === "completed" && settled.videoUrl) {
        row.metadata = { ...(row.metadata as Record<string, unknown>), videoUrl: settled.videoUrl };
      } else if (settled.status === "failed" && settled.error) {
        row.error_message = settled.error;
      }
    }
  }

  return NextResponse.json({ generations: rows });
}
