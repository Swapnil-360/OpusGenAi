-- Already applied directly to production via Supabase MCP on 2026-08-10 —
-- this file exists for repo history / reproducibility on other environments.
--
-- decrement_credits is SECURITY DEFINER (runs with the function owner's
-- privileges, bypassing RLS and all column grants entirely), takes an
-- arbitrary `uid` with no check that the caller owns it, and `amount` is
-- unbounded in the negative direction — GREATEST(0, credits - amount) only
-- floors at zero, so a negative amount ADDS credits without limit.
--
-- Confirmed live-exploitable: an anonymous curl POST to
-- /rest/v1/rpc/decrement_credits with just the public anon key succeeded
-- (HTTP 204) with no login required. The only legitimate caller is
-- lib/credits.ts chargeCredits(), which already calls it through the
-- service-role client (lib/supabase/admin.ts) — service_role has its own
-- independent EXECUTE grant, verified unaffected by this revoke.
revoke execute on function public.decrement_credits(uuid, integer) from anon, authenticated;

-- Hygiene only, not independently exploitable: both are declared
-- RETURNS trigger / RETURNS event_trigger, so Postgres refuses to execute
-- them directly outside real trigger context regardless of grants. Revoking
-- anyway per the Supabase security advisor — a public EXECUTE grant on a
-- SECURITY DEFINER function is a footgun even when currently inert.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- Mutable search_path hardening (advisor: function_search_path_mutable).
-- Pins schema resolution so these SECURITY DEFINER functions can't be
-- redirected by a session-level search_path change.
alter function public.decrement_credits(uuid, integer) set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.handle_updated_at() set search_path = public;
