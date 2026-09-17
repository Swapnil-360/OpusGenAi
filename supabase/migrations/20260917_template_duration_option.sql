-- Migration: Add duration_option to templates table
-- Allows video templates to be configured for 'both' (5s & 10s), '5s' only, or '10s' only.

alter table public.templates
  add column if not exists duration_option text not null default 'both'
  check (duration_option in ('both', '5s', '10s'));

