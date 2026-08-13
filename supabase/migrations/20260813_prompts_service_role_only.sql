-- Already applied to production via Supabase MCP on 2026-08-13 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Follow-up to 20260813_protect_template_prompts.sql, which revoked the prompt
-- column from `anon`. Prompts are now resolved entirely server-side at
-- generation time (the client posts a templateId and never sees the prompt),
-- so no browser session needs the column at all — not even a signed-in one.
-- Revoking from `authenticated` as well means a logged-in user can't extract
-- the catalogue either.
--
-- service_role keeps full access, which is how:
--   • /api/generate and /api/generate-video resolve the prompt to send to fal
--   • /api/templates derives each template's [FIELD] placeholder labels
--   • /api/admin/templates serves real prompts to the admin editor

revoke select on public.templates from authenticated;
grant select (
  id, name, template_type, category, description, tags,
  cover_image_url, preview_video_url, accent_color, is_pro,
  sort_order, created_at, updated_at
) on public.templates to authenticated;
