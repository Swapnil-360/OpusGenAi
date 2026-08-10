-- Run manually in the Supabase SQL Editor.
--
-- Pins down exactly which profile columns the end user may write, and makes
-- that intentional rather than incidental.
--
-- Current state (verified 2026-08-10 by impersonating the authenticated role
-- inside a rolled-back transaction): the `authenticated` role has NO update
-- grant on public.profiles at all —
--
--   ERROR: 42501: permission denied for table profiles
--
-- That is good for money: `credits` cannot be forged by a signed-in user
-- crafting a PATCH with the public anon key and their own JWT. It is bad for
-- everything else, because the account page writes profiles through the
-- BROWSER supabase client, so "Save Profile" (full_name) and the notification
-- toggles (notification_prefs) hit the same denial and fail for real users.
--
-- Column-level GRANTs fix that asymmetry properly: they restore the two
-- columns the UI legitimately writes while leaving `credits` — and the `plan`
-- column added in a later migration — writable only by the service-role client
-- (lib/credits.ts, lib/supabase/admin.ts), which bypasses grants and RLS alike.
--
-- These grants compose with (do not replace) the existing RLS policies, so a
-- user still cannot touch another user's row.

revoke update on public.profiles from authenticated;

grant update (full_name, avatar_url, username, notification_prefs, updated_at)
  on public.profiles to authenticated;

-- credit_transactions is the money audit log. Only chargeCredits() writes it,
-- via the service-role client, so revoking the authenticated role costs nothing
-- and removes any future path to forging or erasing a spend record.
revoke insert, update, delete on public.credit_transactions from authenticated;

-- NOTE: public.generations is deliberately NOT locked here. Six API routes plus
-- app/(dashboard)/tools/replace-bg/page.tsx write it as the authenticated role,
-- so revoking would break generation history. It holds no balance — forging a
-- row pollutes a user's own history and admin analytics but grants no credits.
-- Locking it is a follow-up that requires moving those writes to the admin client.
