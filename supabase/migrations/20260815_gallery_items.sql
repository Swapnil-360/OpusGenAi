-- Already applied to production via Supabase MCP on 2026-08-15 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Public showcase gallery: users can submit their own completed generation
-- for admin review; admins can also add items directly (their own upload, or
-- picking any generation) without going through the review queue themselves.
--
-- caption is deliberately never auto-populated from generations.prompt —
-- that column can hold a resolved *template* prompt, which this app already
-- goes out of its way to keep hidden (see 20260813_prompts_service_role_only.sql).
-- A public gallery showing the exact hidden prompt underneath someone's
-- output would undo that. Caption is either the submitting user's own
-- freely-typed text or left blank.

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid references public.generations(id) on delete set null,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  cover_image_url text, -- poster frame for video items; null for images
  caption text,
  submitted_by uuid references public.profiles(id) on delete set null,
  source text not null check (source in ('user_submitted', 'admin_added')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- One submission per generation — resubmitting the same output (e.g. after
-- a rejection) isn't a supported flow; an admin can still add it manually.
create unique index if not exists gallery_items_generation_id_unique
  on public.gallery_items (generation_id)
  where generation_id is not null;

create index if not exists gallery_items_status_sort_idx
  on public.gallery_items (status, sort_order, created_at desc);

alter table public.gallery_items enable row level security;

-- Public read of approved items only — this is the showcase page's data
-- source, read directly from the browser with the anon key (same pattern as
-- public template reads), so RLS is the only thing standing between a
-- pending/rejected submission and public visibility.
drop policy if exists "public read approved gallery items" on public.gallery_items;
create policy "public read approved gallery items"
  on public.gallery_items for select
  to anon, authenticated
  using (status = 'approved');

-- No insert/update/delete policies for anon/authenticated: every write goes
-- through service-role API routes, which independently verify (a) the
-- submitter owns the generation being submitted and (b) the caller is an
-- admin email for anything touching status/review fields. Mirrors the
-- credits/plan trust model elsewhere in this app — never RLS-writable by the
-- session role for anything money- or moderation-adjacent.
