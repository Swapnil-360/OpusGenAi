# OpusGen AI — Product Requirements Document

**Status:** Living document, reflects current implementation as of 2026-08-15
**Owner:** Swapnil (Md. Miftahur Rahman Swapnil)
**Repo:** `Swapnil-360/OpusGenAi` · **Live:** `opusgenai.com` (Vercel)

---

## 1. Product Summary

OpusGen AI is a web app that turns a plain product photo (or just a text description) into studio-quality marketing images **and now video ads**, for e-commerce, social media, and advertising. It targets small brands and sellers who can't afford a product photoshoot or a video production budget.

**Core promise:** upload your product, describe the scene you want (or pick a template), get a production-ready image or video — without a real shoot, and without the AI ever altering the actual product.

## 2. Target Users

Sellers and small brand owners in categories like skincare, cosmetics, perfume, beverages, food packaging, shoes/sneakers, clothing, watches/jewelry, and electronics — anyone who needs repeated, platform-specific product imagery and video ads but can't run a photoshoot or ad shoot for every scene.

## 3. Goals

- Let a user generate a photo-real marketing image from a text prompt alone, or from their own uploaded product photo with the product itself preserved exactly (never redrawn/distorted).
- Let a user turn a product photo into a short video ad, either freeform (their own motion prompt) or from a curated, category-specific template — without ever seeing the underlying prompt driving it.
- Support combining multiple of a user's own photos into one video (e.g. a product shot plus a separate reference photo).
- Keep a running credit-metered usage model, enforced entirely server-side against the database — never trusting a client-supplied plan/credit value for any billing decision.
- Support Google and email/password sign-in with a real per-user account (profile, credit balance, plan, generation history).
- Protect the product's real IP (template prompts, especially) from being scraped or copied to another platform.

## 4. Non-goals (for now)

- Real payments/billing (Stripe) — plan upgrade buttons are UI-only, show a "coming soon" toast. Credits/plan are still fully DB-enforced; there's just no purchase flow wired to change them yet.
- Multi-object/instance selection in a single photo (e.g. "keep only the middle bottle out of five") — users upload a photo containing a single product.
- Perfect scene-perspective matching / physically based relighting — current approach is prompt-engineering + (for the legacy composite path) canvas compositing, not a dedicated harmonization model.

## 5. Features — Current Status

Status legend: 🟢 Live & real · 🟡 Partial/known gap · 🔴 Not started

| Feature | Status | Notes |
|---|---|---|
| Text-to-image generation | 🟢 | `flux/schnell` via fal.ai, free (1cr), `/api/generate` |
| Product-preserving generation | 🟢 | Uploads go through fal's edit models directly (Gemini 2.5 Flash / Nano Banana 2), not a client-side bg-removal + composite pipeline — product identity preserved by the edit model itself |
| Quality tiers (image) | 🟢 | Standard (Gemini 2.5 Flash, 3cr, Free+), HD (Nano Banana 2 @2K, 5cr, Basic+), Ultra (Nano Banana 2 @4K, 6cr, Basic+) — model + resolution resolved server-side from the requested tier, never trusted from the client |
| Image-to-Video | 🟢 | Standalone `/tools/image-to-video` generator (not chained to image generation). 3 quality tiers: Standard (Seedance 2.0 Mini 720p, 10cr), HD (Wan 2.5 1080p, 12cr), Premium (Seedance 2.5 720p, 25cr) — all generate synced audio. Standard is available to Basic and Pro; HD, Premium, and multi-image stay Pro-only. Basic is capped at `BASIC_STANDARD_VIDEO_LIMIT` (3) Standard videos total, lifetime — not a monthly allowance, since credits themselves don't refill on a billing cycle yet. Enforced server-side (counts the user's own completed/pending Standard image-to-video rows) and reflected in the UI (locked tiers, a usage counter, a full "upgrade to Pro" block once the cap is hit) |
| Video generation resilience | 🟢 | fal jobs run async on their own queue regardless of whether anyone's watching — a generation survives the user closing the tab or navigating away, and is reconciled (completed/failed detected, credits refunded if it failed) the next time `/api/history` loads, not only via the original page's live poll. User-initiated Cancel (`/api/generate-video/[id]/cancel`) attempts `fal.queue.cancel` then re-checks status before deciding the outcome — if the job had already finished, the user gets the video, not a refund for delivered output; otherwise it's refunded and marked cancelled regardless of whether fal's own cancel call succeeded. Cancel is reachable both from the live video generator page and from History (a still-pending row shows a spinner instead of a blank tile, with its own Cancel button — a stuck fal job used to render as an unexplained empty card). The video panel also guards against a page action (new image, navigating away) silently orphaning an in-progress paid job |
| Multi-image video | 🟢 | Combine up to 3 of a user's own photos into one video via `bytedance/seedance-2.0/fast/reference-to-video` (`image_urls` array, `@Image1`/`@Image2`/… referenced in-prompt). Fixed 720p tier, 20cr. Auto-selected server-side whenever 2+ images are attached |
| AI-written video prompts | 🟢 | `/api/enhance-video-prompt` — style + camera-movement picker feeds a vision-model prompt writer (130–180 word production-style briefs) |
| 6 core tools | 🟢 | Text to Image, Remove Background (client-side WASM), Replace Background, Cleanup, Upscale 4×, Uncrop — all real fal.ai-backed routes, `lib/tools-config.ts` |
| Templates (image) | 🟢 | 4 types: `production` (single clean product shot), `universal` (portrait/person scenes), `campaign` (brand/lifestyle scenes — deliberately skips the single-product fidelity suffix), `video` (motion prompts). Prompts resolved server-side from a `templateId`; the prompt text itself never reaches the browser |
| Templates (video) | 🟢 | 16 product-category-specific motion prompts (cosmetics, lipstick, skincare, perfume, drinks, soda, energy drink, ice cream, chocolate, shoes, sneakers, clothing, watch/jewelry, food packaging, electronics, generic). Landing-page cards autoplay their preview clip. Video templates can also declare extra reference-photo slots (`image_slot_labels`) for the multi-image feature above |
| Prompt protection | 🟢 | Template `prompt` column is revoked from both `anon` and `authenticated` at the DB level (column-level grants) — resolved only server-side by `service_role`, at generation time, from a `templateId`. A generated output's own hidden prompt is never sent to the browser |
| Public Gallery | 🟢 | `/gallery` — public showcase, separate route (not a landing section). Users submit their own completed generations from History (pending review); admins approve/reject from a review queue, or add items directly themselves (upload or pick any generation). Only `status='approved'` rows are ever publicly readable — enforced by RLS, not app logic. Caption is never auto-filled from a generation's stored prompt (would leak a hidden template prompt) |
| Credit system | 🟢 | Every credit/plan check reads the DB fresh, server-side, on every request — `lib/credits.ts`, `lib/entitlements.ts`. Deliberately never cached (see §8) |
| Plans | 🟢 | Free (10cr), Basic ($9.99, 50cr, unlocks HD/Ultra image + 3 Standard videos), Pro ($29, 150cr, unlocks unlimited video incl. HD/Premium/multi-image) — `lib/plans.ts` is the single source of truth for every tier's model, cost, and min-plan |
| Auth (Google OAuth + email/password + MFA) | 🟢 | Supabase Auth, `/auth/callback`, TOTP-based 2FA (`/mfa-challenge`), redirect-aware middleware |
| Per-user profile (name, avatar, credits, plan) | 🟢 | `profiles` table |
| Generation history | 🟢 | Server-rendered (`/api/history`, avoids a client-side session-refresh stall on fresh login) — images and videos, full-size lightbox, download, "Submit to Gallery" |
| Admin dashboard | 🟢 | `/adminopusgenai` — Overview (real user/generation/fal-billing stats), Messages (site banner), Feedback, Users (plan/credit management), Templates (full CRUD incl. video-template image slots + preview clips), Hero (landing hero photo config), Gallery (review queue + manual add) |
| Maintenance mode | 🟢 | Vercel Edge Config kill-switch, checked in middleware before any Supabase call so it survives a Supabase outage too |
| Bot protection | 🟢 | Vercel BotID on every credit-spending route |
| Error monitoring | 🟢 | Sentry (`@sentry/nextjs`), tunneled through `/monitoring` to keep CSP `connect-src` limited to `'self'` |
| Read caching | 🟢 | See §8 |

## 6. Technical Architecture

- **Frontend:** Next.js 15.5 (App Router), React 19, Tailwind v4, Framer Motion, Radix primitives
- **Auth/DB:** Supabase (Postgres + Auth + Storage + RLS), `@supabase/ssr` for cookie-based SSR sessions. Every money/entitlement/moderation write goes through the **service-role** client from a server route — never RLS-writable by the session role for anything sensitive (mirrors the credits/plan trust model everywhere it applies: gallery review, template edits, etc.)
- **AI inference:** fal.ai — `flux/schnell` (free text-to-image), `gemini-25-flash-image/edit` + `nano-banana-2/edit` (product-preserving image edit, HD/Ultra), `seedance-2.0/mini/image-to-video`, `wan-25-preview/image-to-video`, `seedance-2.5/image-to-video`, `seedance-2.0/fast/reference-to-video` (multi-image video), `openrouter/router` vision model (prompt enhancement/description)
- **Client-side bg removal:** `@imgly/background-removal` v1.4.5, WASM, model files served from `unpkg.com` (used by the standalone Remove Background tool)
- **Hosting:** Vercel, GitHub-connected (`Swapnil-360/OpusGenAi`), Production Branch = `master`
- **Middleware:** protects `/generate`, `/studio`, `/history`, `/account`, `/templates` (the authenticated browse page — distinct from the public landing sections), `/adminopusgenai`; maintenance-mode allowlist covers the admin panel, login, legal pages, and `/gallery` (informational, not "processing" anything)

## 7. Data Model

`supabase/migrations/` is tracked in-repo (18 files) — every schema change since 2026-08-02 has a corresponding migration; earlier schema exists directly in the live project with no matching migration file.

- **`profiles`** — `id`, `full_name`, `avatar_url`, `credits`, `plan`, `notification_prefs`, `created_at`, `updated_at`. `credits`/`plan` are locked down to service-role writes only.
- **`generations`** — `id`, `user_id`, `tool_id`, `status`, `prompt`, `input_image_url`, `output_image_url`, `credit_cost`, `metadata` (jsonb: `images[]` / `videoUrl`, `quality`, `model`, `resolution`, `durationSeconds`, `imageCount`, `templateId?`), `error_message`, `created_at`, `completed_at`
- **`credit_transactions`** — `user_id`, `amount`, `type`, `description` — append-only ledger
- **`templates`** — `id`, `name`, `template_type` (`production`/`universal`/`campaign`/`video`), `category`, `description`, `tags[]`, `prompt` (service-role only — revoked from `anon`/`authenticated`), `image_slot_labels[]` (extra reference-photo slots for multi-image video templates), `cover_image_url`, `preview_video_url`, `accent_color`, `is_pro`, `sort_order`
- **`gallery_items`** — `id`, `generation_id`, `media_type`, `media_url`, `cover_image_url`, `caption`, `submitted_by`, `source` (`user_submitted`/`admin_added`), `status` (`pending`/`approved`/`rejected`), `reviewed_by`, `sort_order`, `created_at`, `approved_at`. RLS: public read of `status='approved'` only; every write is service-role
- **`site_settings`** — keyed jsonb rows (`hero_images`, `site_banner`) for admin-configured landing-page content
- **RPC `decrement_credits(uid, amount)`** — `SECURITY DEFINER`, floors at 0, **execute revoked from `anon`/`authenticated`** (see §9 — this was a real, fixed exploit)
- **Storage buckets:** `generated-images`, `user-uploads` (private), `template-previews`, `template-videos`, `hero-images`, `gallery-uploads` (public)

## 8. Caching Architecture

Built on **Next.js's own Data Cache** (`unstable_cache` + `revalidateTag`, `lib/cache.ts`) — not Redis/Upstash. On Vercel this is already a shared, durable cache (not per-instance process memory), so it needed no new infrastructure or secrets to be production-safe on serverless.

**Cached:**
- `GET /api/templates` — the full template catalogue, identical for every signed-in user. TTL 30 min (`CACHE_TTL_TEMPLATES_SECONDS`). Invalidated immediately after every admin template mutation (create/update/delete/cover-image/preview/preview-video set or remove).
- `GET /api/admin/overview` — a genuinely expensive aggregate (full `generations` scan, full auth user list, an external fal.ai billing call). TTL 60s (`CACHE_TTL_ADMIN_OVERVIEW_SECONDS`), TTL-only invalidation by design (it aggregates every user's activity continuously — no single mutation to hang invalidation off).

**Deliberately never cached:** credit balance and plan (`lib/credits.ts`, `lib/entitlements.ts`) — read fresh from the DB on every request, no exceptions, because they gate money/entitlement decisions (see §9). `/api/me` and `/api/history` — cheap indexed reads, and a user expects to see their own just-created data immediately. Public landing-page reads (templates carousel, hero images, gallery) — these already bypass the app's own server (browser → Supabase PostgREST directly with the anon key) to avoid a session-lock stall; caching would have to go through a server route, which would undo that.

`cachedQuery()`'s cache-aside wrapper falls back to a direct DB call if the cache layer itself fails for any reason (construction or read) — a caching bug can never take a route down. Verified with 12 unit tests (`lib/cache.test.ts`, `next/cache` mocked — the real Data Cache needs a running Next.js server this repo's Vitest setup doesn't provide).

**Operational caveat:** invalidation only fires from the admin API routes (`app/api/admin/templates/**`). A direct SQL change to `templates` — via the Supabase dashboard or MCP, bypassing the app entirely — does **not** trigger `invalidateTemplatesCache()`, and could serve a stale catalogue for up to the 30-minute TTL. This has happened at least once already (the 16-template video catalogue swap on 2026-08-15 was a raw-SQL migration) — harmless that time only because it landed before the caching layer existed. Any future direct-SQL edit to `templates` should be followed by a redeploy (which cold-starts the Data Cache) or a short wait, until/unless a manual invalidation trigger is built for the admin panel.

## 9. Security Incidents (fixed, documented for institutional memory)

- **`decrement_credits` RPC exploit** — `SECURITY DEFINER`, callable by `anon` with an arbitrary `uid` and a negative `amount` (which *adds* credits). Verified live with curl before fixing. Fixed by revoking `execute` from `anon`/`authenticated`; `service_role` keeps access.
- **Template prompt scraping** — the "public read templates" RLS policy plus the `anon` key shipped in client JS meant the entire prompt catalogue was readable with one unauthenticated `curl`. Fixed with column-level grants (RLS can't express "every column except this one"); later tightened further to revoke `prompt` from `authenticated` too, since prompts are now resolved entirely server-side and no browser session needs the column at all.
- **BotID route gaps** — twice, a new credit-spending route (`/api/generate-video`, later others) shipped without being registered in `BOTID_PROTECTED_ROUTES`, which blocked *all* real users with "Automated requests aren't allowed here," not just bots. Now checked immediately when any new money-spending route is added.

## 10. Known Limitations

- **No real payments** — plan tiers are cosmetic; upgrading shows a "coming soon" toast. Credits/plan enforcement is fully real regardless.
- **Video template preview clips** — most of the 16 video templates still have no real preview clip generated (admin tooling to add one exists; generating them costs real fal.ai spend per clip, not yet done for all 16).
- **History exposes the resolved prompt** — including, for a template-based generation, the full resolved template prompt (via Copy Prompt / "reuse in generate"). This is a real gap against the template-prompt-hiding work in §5/§9: a user can see and copy their own generation's underlying prompt from their own History, even though the same prompt is hidden everywhere else. Flagged, not yet fixed.
- **Gallery caption editing** — the review-queue UI has no inline caption editor yet (the API supports it via `PATCH /api/admin/gallery/[id]`); captions are set at submission time or left blank.
- **Gallery "pick a user's generation" admin flow** — supported by the API (`POST /api/admin/gallery` with `{ generationId }`), but the admin UI only exposes the direct-file-upload path; no generation search/picker built yet.

## 11. Near-term Roadmap (suggested, not committed)

1. Fix the History prompt-exposure gap (§10) — likely: strip or summarize the prompt shown for template-originated generations, same as the generation UI already does.
2. Generate real preview clips for the remaining video templates.
3. Stripe integration for real plan upgrades/billing.
4. Gallery: inline caption editing + a generation picker in the admin manual-add flow.
