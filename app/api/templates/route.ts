import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPlaceholders } from "@/lib/template-prompt";

export const dynamic = "force-dynamic";

/**
 * Templates for signed-in users, with the prompt deliberately stripped.
 *
 * The prompt column is revoked from both `anon` and `authenticated` at the
 * database level — it's resolved server-side at generation time from a
 * templateId instead, so it never needs to reach a browser. What the client
 * does get is `placeholders`: the list of [FIELD] labels a template needs
 * filled in (e.g. "YOUR BRAND"), which is enough to render the input fields
 * without revealing any of the prompt around them.
 *
 * Reads via the service-role client because that's the only role that can see
 * the prompt column now; the session check above is what gates access.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("templates")
    .select("id,name,template_type,category,description,tags,prompt,cover_image_url,preview_video_url,accent_color,is_pro,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("templates route error:", error.message);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }

  const templates = (data ?? []).map(({ prompt, ...rest }) => ({
    ...rest,
    placeholders: extractPlaceholders(prompt ?? ""),
  }));

  return NextResponse.json({ templates });
}
