-- Already applied to production via Supabase MCP on 2026-08-16 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Extra reference-photo slots on a video template can be FIXED and REQUIRED
-- (image_slot_labels, e.g. "Reference Model Photo" - must be filled before
-- generating) or, when this flag is true, OPTIONAL and unstructured - the
-- same growable "add a photo" flow used when no template is applied at all,
-- just still available with a template's prompt in play. For a template
-- whose prompt is written to adapt to whatever content is uploaded rather
-- than needing a specific shot in each numbered slot.
alter table public.templates
  add column if not exists image_slots_optional boolean not null default false;
