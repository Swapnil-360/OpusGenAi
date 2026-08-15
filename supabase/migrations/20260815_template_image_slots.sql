-- Already applied to production via Supabase MCP on 2026-08-15 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Extra reference-image slots for video templates, e.g. a template that
-- combines a product photo with a separate "desired model pose" photo.
-- Empty (the default) means "classic single-image template" — all existing
-- video templates keep working exactly as before, no data backfill needed.
--
-- Labels only (e.g. "Reference Model Photo"), never prompt text, so this is
-- safe for the same exposure level as cover_image_url/tags — no grant change
-- needed since it's read only through the service-role admin/API routes,
-- same as every other template column already is for authenticated users.
alter table public.templates
  add column if not exists image_slot_labels text[] not null default '{}';
