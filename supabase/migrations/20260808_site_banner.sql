-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Seeds the shared site-announcement-banner row in the existing generic
-- site_settings table (same table already used for hero_images). The banner
-- was previously stored in the admin's own browser localStorage, meaning
-- "Save & Publish" never actually reached any other visitor — this makes it
-- a real shared value everyone reads.

insert into public.site_settings (id, value)
values ('site_banner', '{"mode": "normal", "message": "", "versionLabel": ""}'::jsonb)
on conflict (id) do nothing;
