-- Subscriptions and Webhook Idempotency
-- To run in Supabase SQL Editor or migration runner.

-- 1. Subscription tracking columns on profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'past_due', 'canceled', 'trialing', 'unpaid', 'incomplete')),
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- Unique index for customer lookup during webhook processing
create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Ensure these new billing columns are NOT writable by the authenticated role
-- (matching the lockdown from 20260810_lock_credit_columns.sql)
-- Only service_role can write these columns.

-- 2. Webhook idempotency table
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  gateway text not null default 'stripe',
  event_type text not null,
  payload jsonb,
  status text not null default 'processed'
    check (status in ('processing', 'processed', 'failed')),
  error_message text,
  processed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists webhook_events_event_id_idx
  on public.webhook_events (event_id);

alter table public.webhook_events enable row level security;

-- Lock down webhook_events completely from client roles
revoke all on public.webhook_events from public, anon, authenticated;
grant all on public.webhook_events to service_role;

