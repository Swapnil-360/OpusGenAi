-- Migration: Waitlist Signups
-- Table for capturing waitlist entries from the "What's coming next" section.
-- Run in the Supabase SQL Editor if running migrations manually.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('Brand', 'Agency', 'Seller')),
  source text default 'coming_soon',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Unique index on lowercase email to handle upserts/duplicate attempts cleanly
create unique index if not exists idx_waitlist_email_unique on public.waitlist (lower(email));
create index if not exists idx_waitlist_created_at on public.waitlist (created_at desc);

-- Enable Row Level Security (RLS)
alter table public.waitlist enable row level security;

-- Allow public anonymous/authenticated insertions (visitors on landing page)
drop policy if exists "Allow public insert to waitlist" on public.waitlist;
create policy "Allow public insert to waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Allow full access to service_role (used by server endpoints and admin exports)
drop policy if exists "Allow service_role full access to waitlist" on public.waitlist;
create policy "Allow service_role full access to waitlist"
  on public.waitlist
  for all
  to service_role
  using (true)
  with check (true);
