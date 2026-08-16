-- Already applied to production via Supabase MCP on 2026-08-16 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Three endpoints (/api/enhance-prompt, /api/enhance-video-prompt,
-- /api/caption) call a vision model but deliberately charge no credits,
-- because each call costs a fraction of a cent. Nothing bounded how many a
-- signed-in account could make, so a free account sitting at zero credits
-- could still call them in a loop indefinitely. The credit system — this
-- app's main abuse control — does not apply to them by design.
--
-- Counting lives in Postgres rather than process memory because these run as
-- serverless functions, where a local counter is per-instance and so bounds
-- nothing in practice. Supabase is already on the path of every request that
-- needs limiting, so this adds no new infrastructure.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- No policy is defined on purpose: only the service role (which bypasses RLS)
-- touches this table, so a browser session can neither read another user's
-- counters nor reset its own.
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

-- Records one call and reports whether it is allowed. Insert-or-update is a
-- single statement, so simultaneous calls can't both read the same count and
-- both conclude they're under the limit. An expired window resets the counter
-- in place rather than needing a sweeper job.
create or replace function public.consume_rate_limit(
  k text,
  max_calls integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_count integer;
  cutoff timestamptz := now() - make_interval(secs => window_seconds);
begin
  insert into rate_limits as rl (key, window_start, count)
  values (k, now(), 1)
  on conflict (key) do update
    set count = case when rl.window_start < cutoff then 1 else rl.count + 1 end,
        window_start = case when rl.window_start < cutoff then now() else rl.window_start end
  returning rl.count into new_count;

  return new_count <= max_calls;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);
