import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Templates *including* their prompt, for signed-in users only.
 *
 * The prompt column is revoked from the `anon` role at the database level
 * (see supabase/migrations/20260813_protect_template_prompts.sql) because the
 * anon key ships in the client bundle — anyone could otherwise curl every
 * prompt in the catalogue without an account. Public surfaces (the landing
 * page) read the remaining columns directly via lib/supabase/public-rest and
 * simply get no prompt; dashboard surfaces call this route instead.
 *
 * Uses the session client, not the service-role client: the grant to
 * `authenticated` is what authorises the prompt column, so an unauthenticated
 * request fails here rather than silently succeeding with elevated rights.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,template_type,category,description,tags,prompt,cover_image_url,preview_video_url,accent_color,is_pro,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("templates route error:", error.message);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}
