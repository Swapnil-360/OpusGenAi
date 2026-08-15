import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { settlePendingVideoRow, type VideoRowMetadata } from "@/lib/video-status";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("generations")
    .select("id, user_id, status, error_message, credit_cost, metadata")
    .eq("id", id)
    .single();

  // Explicit ownership check even though this uses the admin client — the
  // equivalent RLS policy (generations_select_own) only applies to the
  // session client, and this route needs the admin client to WRITE status
  // transitions, so the read path must enforce ownership itself.
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (row.status !== "pending") {
    const meta = (row.metadata ?? {}) as VideoRowMetadata;
    return NextResponse.json({ status: row.status, videoUrl: meta.videoUrl, error: row.error_message });
  }

  const settled = await settlePendingVideoRow(admin, row, user.email);
  return NextResponse.json(settled);
}
