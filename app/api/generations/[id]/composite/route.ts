import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWithinImageSizeLimit, IMAGE_TOO_LARGE_MESSAGE } from "@/lib/request-limits";

/**
 * Saves the final composited image for a Replace Background generation.
 *
 * Replace Background is the one tool whose finished output is produced in the
 * browser: the server generates the new backdrop, then the client cuts the
 * product out (WASM) and composites the two. That final image still has to
 * land in the history row.
 *
 * It used to be written by the browser talking to Postgres directly
 * (`supabase.from("generations").update(...)`), which required handing every
 * signed-in user UPDATE on the generations table. That grant applied to the
 * whole row, not just this one field — a user could rewrite `credit_cost` on
 * their own pending video job and then cancel it for an arbitrary refund, or
 * rewrite `metadata.quality` to reset the Basic plan's video allowance. This
 * route exists so that grant can be revoked: the only client-writable field
 * left is the composited image, and it is written here, server-side, against
 * a row this user is verified to own.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let image: unknown;
  try {
    ({ image } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "A composited image is required." }, { status: 400 });
  }
  if (!isWithinImageSizeLimit(image)) {
    return NextResponse.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("generations")
    .select("id, user_id, tool_id, metadata")
    .eq("id", id)
    .single();

  // Same 404-for-both shape the video status/cancel routes use: a row that
  // isn't yours is indistinguishable from one that doesn't exist, so this
  // can't be used to probe which generation ids are real.
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Scoped to the one tool that legitimately finishes client-side, so this
  // can't be used to overwrite the output of, say, a video generation.
  if (row.tool_id !== "replace-bg") {
    return NextResponse.json({ error: "Not supported for this generation." }, { status: 400 });
  }

  // Only the image list is replaced — the rest of the row's metadata (and
  // every column outside it) is left exactly as the server wrote it.
  const existing = (row.metadata ?? {}) as Record<string, unknown>;
  const { error } = await admin
    .from("generations")
    .update({ metadata: { ...existing, images: [image] } })
    .eq("id", id);

  if (error) {
    console.error("composite save failed:", error.message);
    return NextResponse.json({ error: "Couldn't save the final image." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
