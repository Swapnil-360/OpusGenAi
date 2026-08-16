-- Already applied to production via Supabase MCP on 2026-08-16 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Two credit bugs, both money-affecting, both only reachable under concurrency:
--
-- 1. Overspend. Routes read the balance, decided, then decremented in a
--    separate statement — with a whole AI generation in between. Two requests
--    fired together both saw a sufficient balance and both proceeded, and the
--    old decrement_credits used GREATEST(0, credits - amount), so the second
--    charge silently clamped instead of failing. Net effect: a paid generation
--    for free. charge_credits below makes the guard and the decrement one
--    statement; under READ COMMITTED the second caller re-evaluates
--    `credits >= amount` against the already-decremented row and matches
--    nothing, returning NULL so the route can reject with a 402.
--
-- 2. Lost refunds. Refunds wrote back a balance read earlier in the request
--    (`credits = <stale read> + amount`), discarding any charge that landed in
--    between. refund_credits increments in place instead.

create or replace function public.charge_credits(uid uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_balance integer;
begin
  if amount is null or amount < 0 then
    raise exception 'charge_credits: amount must be >= 0';
  end if;

  update profiles
     set credits = credits - amount,
         updated_at = now()
   where id = uid
     and credits >= amount
  returning credits into new_balance;

  -- NULL means the guard matched no row: insufficient balance, nothing
  -- deducted. Callers MUST treat that as "reject", not "charged zero".
  return new_balance;
end;
$$;

create or replace function public.refund_credits(uid uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_balance integer;
begin
  if amount is null or amount < 0 then
    raise exception 'refund_credits: amount must be >= 0';
  end if;

  update profiles
     set credits = credits + amount,
         updated_at = now()
   where id = uid
  returning credits into new_balance;

  return new_balance;
end;
$$;

-- Callable only by the service role, never from a browser session — the same
-- lockdown decrement_credits already carries after it was found anon-callable.
revoke all on function public.charge_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer) from public, anon, authenticated;
grant execute on function public.charge_credits(uuid, integer) to service_role;
grant execute on function public.refund_credits(uuid, integer) to service_role;

-- ── Hot-path indexes ───────────────────────────────────────────────────────
-- `generations` carried only its primary key, yet every read filters by
-- user_id: History, /api/me's completed count, the Basic video-limit count and
-- the Studio page were all sequential scans of the whole table.
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create index if not exists generations_pending_idx
  on public.generations (user_id, tool_id, status);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);
