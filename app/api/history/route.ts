import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { settlePendingVideoRow } from "@/lib/video-status";
import { pruneUserHistory, MAX_USER_HISTORY } from "@/lib/history-limit";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Enforce 20-item retention limit (prune oldest excess items)
  await pruneUserHistory(admin, user.id, MAX_USER_HISTORY);

  const { data, error } = await supabase
    .from("generations")
    .select(
      "id, tool_id, prompt, status, metadata, credit_cost, error_message, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_USER_HISTORY);

  if (error) {
    console.error("history route error:", error.message);
    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 },
    );
  }

  const rows = data ?? [];

  // A video generation's completion is otherwise only ever detected as a
  // side effect of the live status-poll route running while the generator
  // page stays open — close the tab, and fal finishes the job regardless,
  // but nothing ever tells our own `generations` row. Reconciling any still-
  // pending video rows right here means simply reopening the app (landing on
  // History, or any page that loads it) is what surfaces a result the user
  // walked away from, not something they had to know to go check for.
  const pendingVideoRows = rows.filter(
    (r) => r.tool_id === "image-to-video" && r.status === "pending",
  );
  if (pendingVideoRows.length > 0) {
    const admin = createAdminClient();
    const settledById = new Map(
      await Promise.all(
        pendingVideoRows.map(async (row) => {
          const settled = await settlePendingVideoRow(
            admin,
            { ...row, user_id: user.id },
            user.email,
          );
          return [row.id, settled] as const;
        }),
      ),
    );
    for (const row of rows) {
      const settled = settledById.get(row.id);
      if (!settled || settled.status === "pending") continue;
      row.status = settled.status;
      if (settled.status === "completed" && settled.videoUrl) {
        row.metadata = {
          ...(row.metadata as Record<string, unknown>),
          videoUrl: settled.videoUrl,
        };
      } else if (settled.status === "failed" && settled.error) {
        row.error_message = settled.error;
      }
    }
  }

  // Template prompts never reach the browser (PRD §5, §10). Redact the raw
  // resolved prompt from history for template-based rows, leaving only any
  // custom user prompt if present so proprietary template prompts aren't exposed.
  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (meta?.templateId) {
      row.prompt = typeof meta.userPrompt === "string" ? meta.userPrompt : "";
    }
  }

  return NextResponse.json({
    generations: rows,
    limit: MAX_USER_HISTORY,
    count: rows.length,
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("all") === "true";

  const admin = createAdminClient();

  if (clearAll) {
    // Unlink any credit_transactions rows before deleting generations
    const { data: userGenIds } = await admin
      .from("generations")
      .select("id")
      .eq("user_id", user.id)
      .neq("status", "pending");

    if (userGenIds && userGenIds.length > 0) {
      const ids = userGenIds.map((g) => g.id);
      await admin
        .from("credit_transactions")
        .update({ generation_id: null })
        .in("generation_id", ids);
    }

    const { error } = await admin
      .from("generations")
      .delete()
      .eq("user_id", user.id)
      .neq("status", "pending");

    if (error) {
      console.error("Failed to clear history:", error.message);
      return NextResponse.json(
        { error: "Failed to clear history" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, cleared: true });
  }

  if (!id) {
    return NextResponse.json(
      { error: "Generation ID is required" },
      { status: 400 },
    );
  }

  const { data: row } = await admin
    .from("generations")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  if (row.status === "pending") {
    return NextResponse.json(
      { error: "Please cancel the active generation before deleting." },
      { status: 400 },
    );
  }

  // Unlink foreign key in credit transactions if linked
  await admin
    .from("credit_transactions")
    .update({ generation_id: null })
    .eq("generation_id", id);

  const { error } = await admin
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete generation:", error.message);
    return NextResponse.json(
      { error: "Failed to delete generation" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id });
}
