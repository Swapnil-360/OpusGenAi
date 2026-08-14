-- Already applied to production via Supabase MCP on 2026-08-15 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Public bucket for template preview clips shown on the landing page.
-- Writes happen only through /api/admin/templates/[id]/preview-video, which
-- uses the service-role key, so no anon/authenticated storage policies are
-- added here — public = true covers the read side the landing page needs.
--
-- Clips are copied into this bucket rather than linking the column straight
-- at a fal.media URL: that would work today but leaves the public landing
-- page depending on fal's retention of a file we don't control.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-videos',
  'template-videos',
  true,
  52428800, -- 50MB; a 5s 1080p clip is a couple of MB, so this is generous
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
