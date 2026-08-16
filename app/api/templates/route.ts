import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPlaceholders } from "@/lib/template-prompt";
import { cachedQuery, CACHE_TAGS, CACHE_TTL } from "@/lib/cache";

// Same query for every signed-in user (no per-user filter exists in it), so
// one shared cache entry behind the auth check below is safe — a session
// cookie's validity was already confirmed before this is ever called.
const getCachedTemplateRows = cachedQuery(
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("templates")
      .select("id,name,template_type,category,description,tags,prompt,cover_image_url,preview_video_url,image_slot_labels,image_slots_optional,accent_color,is_pro,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  ["templates", "all"],
  { tags: [CACHE_TAGS.templates], revalidateSeconds: CACHE_TTL.templates }
);

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

  let rows;
  try {
    rows = await getCachedTemplateRows();
  } catch (error) {
    console.error("templates route error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }

  const templates = rows.map(({ prompt, ...rest }) => ({
    ...rest,
    placeholders: extractPlaceholders(prompt ?? ""),
  }));

  return NextResponse.json({ templates });
}
