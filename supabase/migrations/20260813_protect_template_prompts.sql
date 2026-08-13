-- Already applied to production via Supabase MCP on 2026-08-13 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Template prompts are the product's real IP. The "public read templates" RLS
-- policy combined with the anon key (which ships inside the client JS bundle)
-- meant the entire prompt catalogue was readable with a single unauthenticated
-- curl — verified before this change:
--
--   curl "$SUPABASE_URL/rest/v1/templates?select=name,prompt" \
--        -H "apikey: $ANON_KEY" -H "authorization: Bearer $ANON_KEY"
--   → [{"name":"Luxury Product Shoot","prompt":"on a polished black marble…"}]
--
-- RLS is row-level and cannot express "every column except this one", so this
-- uses column-level grants — the same mechanism protecting profiles.credits.
-- anon keeps everything the public landing page needs to render (name,
-- description, cover art, category, colour) and loses only `prompt`;
-- `authenticated` is untouched, so signed-in users can still read and edit
-- prompts through /api/templates.

revoke select on public.templates from anon;
grant select (
  id, name, template_type, category, description, tags,
  cover_image_url, preview_video_url, accent_color, is_pro,
  sort_order, created_at, updated_at
) on public.templates to anon;
