-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Adds persisted notification-preference storage to profiles.
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{
    "generationDone": true,
    "billing": true,
    "tips": false,
    "newsletter": false
  }'::jsonb;
