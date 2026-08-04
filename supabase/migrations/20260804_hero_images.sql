-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Generic key/value site settings table (starts with the landing-page hero
-- image config) plus a public storage bucket for admin-uploaded hero photos.

create table if not exists public.site_settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select using (true);
-- No insert/update/delete policy: writes only via the admin API route's
-- service-role client (lib/supabase/admin.ts), same as templates.

insert into public.site_settings (id, value)
values ('hero_images', '{"mode": "random", "templateIds": [], "customImageUrls": []}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('hero-images', 'hero-images', true)
on conflict (id) do nothing;

drop policy if exists "public read hero images" on storage.objects;
create policy "public read hero images" on storage.objects
  for select using (bucket_id = 'hero-images');
