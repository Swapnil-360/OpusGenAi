-- Run manually in the Supabase SQL Editor.
-- Seeds the dashboard welcome-message row (site_settings table already exists
-- from the 20260808_site_banner migration).
insert into public.site_settings (id, value)
values ('welcome_message', '{"useDefault": true, "message": "Welcome back! Ready to create something amazing?"}'::jsonb)
on conflict (id) do nothing;
