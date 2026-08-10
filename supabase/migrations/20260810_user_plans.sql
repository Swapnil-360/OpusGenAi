-- Run manually in the Supabase SQL Editor.
--
-- There is currently no plan system at all: profiles has `credits` but no
-- concept of a tier, and PLANS in lib/mock-data.ts is unenforced landing-page
-- copy. This adds the column server-side entitlement checks will read.
--
-- Deliberately NOT added to the authenticated column-update grant from
-- 20260810_lock_credit_columns.sql — plan changes only ever happen through
-- an admin action or (later) a checkout webhook, both via the service-role
-- client, which bypasses grants entirely.
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'basic', 'pro')),
  add column if not exists plan_renews_at timestamptz;
