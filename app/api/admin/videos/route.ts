import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * The admin's own completed video generations, for the "use one of my videos
 * as this template's preview" picker.
 *
 * Scoped to the admin's own user_id rather than every user's videos: the
 * landing page is public, so a preview clip is published content, and nobody
 * else's generation should be publishable by an admin from a picker.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("generations")
    .select("id, prompt, metadata, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("admin videos route error:", error.message);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }

  const videos = (data ?? [])
    .map((row) => {
      const meta = (row.metadata ?? {}) as { videoUrl?: string; quality?: string };
      if (!meta.videoUrl) return null;
      return {
        id: row.id,
        prompt: row.prompt,
        videoUrl: meta.videoUrl,
        quality: meta.quality ?? null,
        createdAt: row.created_at,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return NextResponse.json({ videos });
}
