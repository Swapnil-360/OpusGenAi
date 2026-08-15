-- Already applied to production via Supabase MCP on 2026-08-15 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Storage for admin-manual gallery uploads (the "admin can manually showcase
-- too" path — a file the admin uploads directly, not tied to any user's
-- generation). Public bucket: this is showcase content by definition, same
-- exposure level as template-previews/template-videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-uploads',
  'gallery-uploads',
  true,
  52428800, -- 50MB, matches template-videos
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
