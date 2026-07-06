# OpusGen AI — Product Requirements Document

**Status:** Living document, reflects current implementation as of 2026-07-07
**Owner:** Swapnil (Md. Miftahur Rahman Swapnil)
**Repo:** `Swapnil-360/OpusGenAi` · **Live:** `opusgenai.vercel.app`

---

## 1. Product Summary

OpusGen AI is a web app that turns a plain product photo (or just a text description) into studio-quality marketing visuals for e-commerce, social media, and advertising. It targets small brands and sellers who can't afford a product photography studio.

**Core promise:** upload your product, describe the scene you want, get a production-ready image — without a real photoshoot, and without the AI ever altering the actual product.

## 2. Target Users

Sellers and small brand owners in categories like skincare, cosmetics, supplements, candles, jewelry, apparel accessories, and similar physical products — anyone who needs repeated, platform-specific product imagery (website listings, marketplace listings, social posts, ad creative) but can't run a photoshoot for every scene.

## 3. Goals

- Let a user generate a photo-real marketing image from a text prompt alone (no product photo required).
- When a user *does* upload their real product photo, guarantee the product itself is never redrawn, distorted, or altered by the AI — only the scene around it changes.
- Make "what to type" easy for non-photographers via curated use-case prompt presets (Website, Marketplace, Social, Poster/Ad, Campaign).
- Keep a running credit-metered usage model so cost stays bounded per user.
- Support Google and email/password sign-in with a real per-user account (profile, credit balance, generation history).

## 4. Non-goals (for now)

- Real payments/billing (Stripe) — plan upgrade buttons are UI-only, show a "coming soon" toast.
- Multi-object/instance selection (e.g., "keep only the middle bottle out of five") — out of scope; users must upload a photo containing a single product.
- Perfect scene-perspective matching / physically based relighting of the composited product — current approach is prompt-engineering + canvas compositing, not a dedicated harmonization model.
- Video, animation output.

## 5. Features — Current Status

Status legend: 🟢 Live & real · 🟡 UI built, backend mocked · 🔴 Not started

| Feature | Status | Notes |
|---|---|---|
| Text-to-image generation | 🟢 | FLUX.1-schnell via Hugging Face Inference, `/api/generate` |
| Product-preserving generation | 🟢 | Client-side bg removal (`@imgly/background-removal`, WASM) → server generates *scene only* → canvas composite with alpha-trim + grounded shadow. Product pixels are never sent through a generative model. |
| Use-case prompt presets | 🟢 | Website/Product Page, Marketplace Listing, Social Media Post, Poster/Ad Banner, Marketing Campaign — additive, appendable pills |
| Product-type quick prompts | 🟢 | Skincare, Sneakers, Candle, Jewelry, etc. — static full-prompt fills |
| Template picker | 🟢 (prompts real, previews are stock photos) | 13 templates across 8 categories; selecting one fills the prompt field. Preview thumbnails are `picsum.photos` placeholders, not real generated samples. |
| Remove Background (tool) | 🟢 | Client-side WASM (`@imgly/background-removal`, "medium" model via unpkg CDN), no server round-trip |
| Upscale 4× (tool) | 🟢 | `caidas/swin2SR-realworld-sr-x4-large` via HF, real `/api/upscale` route |
| Replace Background (tool) | 🟡 | UI complete (scene presets, custom prompt), `process()` is a 2.6s `setTimeout` returning a stock photo |
| Cleanup / object removal (tool) | 🟡 | UI complete, mocked the same way |
| Uncrop / expand image (tool) | 🟡 | UI complete, mocked the same way |
| Content Studio (captions/hashtags) | 🟡 | Real history images load from Supabase; caption/hashtag generation pulls from a static local bank (`lib/caption-bank.ts`), not from the already-built `/api/caption` route (Zephyr-7B via HF) |
| Auth (Google OAuth + email/password) | 🟢 | Supabase Auth, `/auth/callback` exchange, redirect-aware middleware |
| Per-user profile (name, avatar, credits) | 🟢 | `profiles` table, auto-created + seeded with 10 credits on signup via `handle_new_user()` trigger |
| Credit system | 🟢 | Server-enforced in `/api/generate`: balance check → generate → persist → `decrement_credits` RPC → transaction log |
| Generation history | 🟢 | Real Supabase-backed list (prompt, image, credit cost, date) |
| Pricing plans (Free/Basic/Pro) | 🟡 | Static tiers defined and displayed; no real billing wired up |
| Admin dashboard | 🟡 | `/adminopusgenai` — fully mocked stats/users/feedback |

## 6. Technical Architecture

- **Frontend:** Next.js 15 (App Router), React, Tailwind, Framer Motion, shadcn/ui components
- **Auth/DB:** Supabase (Postgres + Auth + RLS), `@supabase/ssr` for cookie-based SSR sessions
- **AI inference:** Hugging Face Inference API (free tier) — FLUX.1-schnell (image gen), swin2SR (upscale), RMBG-1.4 (server-side bg removal, currently unused by the UI), Zephyr-7B (captions, currently unused by the UI)
- **Background removal (client):** `@imgly/background-removal` v1.4.5, WASM, model/data files served from `unpkg.com` (the library's own CDN endpoints were found to be broken/404ing during integration)
- **Hosting:** Vercel, GitHub-connected (`Swapnil-360/OpusGenAi`), Production Branch = `master`
- **Middleware:** protects `/generate`, `/studio`, `/history`, `/account`, `/templates`, `/adminopusgenai`; dev-mode bypasses auth entirely when `NODE_ENV=development`

## 7. Data Model (inferred from code — no migrations tracked in-repo)

- **`profiles`** — `id`, `full_name`, `username`, `avatar_url`, `credits`, `created_at`, `updated_at`
- **`generations`** — `id`, `user_id`, `tool_id`, `status`, `prompt`, `input_image_url`, `output_image_url`, `credit_cost`, `metadata` (jsonb: `images[]`, `aspectRatio`, `templateId?`, `productPreserved?`), `error_message`, `created_at`, `completed_at`
- **`credit_transactions`** — `user_id`, `amount`, `type`, `description`
- **RPC `decrement_credits(uid, amount)`** — `SECURITY DEFINER` function, floors at 0
- **Trigger `handle_new_user()`** — on signup, inserts a `profiles` row (`full_name`, `avatar_url` from OAuth metadata) and a `+10` `credit_transactions` welcome bonus row

⚠️ These live in the Supabase project directly — there is no `supabase/migrations` folder checked into this repo. Schema changes made via the Supabase dashboard/MCP are not currently version-controlled in git.

## 8. Pricing (current, static — no billing integration)

| Plan | Price | Credits/mo | Notes |
|---|---|---|---|
| Free | $0 | 10 | All 6 tools, standard quality, JPG export, 8 templates |
| Basic | $9.99 | 35 | HD quality, PNG+JPG, all templates, social captions |
| Pro | $18 (was $25) | 100 | 4K upscale, batch processing, priority queue, caption studio |

1 credit = 1 image generation. Upgrade buttons currently show a "Stripe integration coming soon" placeholder.

## 9. Known Limitations

- **Multi-object source photos**: background removal keeps *everything* in the foreground of the uploaded photo — if a user photographs several products together, all of them appear in the composited result. No single-subject selection exists.
- **Glass/transparent products**: matting quality degrades on reflective/transparent items (perfume bottles, glassware) — inherent to the segmentation model, not fixable by prompting.
- **Scene-composite realism**: product placement uses fixed-ratio centering + a generic contact shadow, not true perspective-matching or relighting. Works well for flat/simple studio-style backdrops; can look pasted-on against complex generated scenes.
- **HF free-tier inference**: subject to rate limits (~500–1000 requests/day observed) and occasional cold-start latency; no SLA.
- **Three tools are UI-only stubs** (Replace BG, Cleanup, Uncrop) — see table above.
- **Content Studio doesn't use its own API route** — `/api/caption` (Zephyr-7B) exists and works but is dead code; the page uses a static local caption bank instead.
- **No real payments** — plan tiers are cosmetic.
- **Schema isn't version-controlled** — Supabase schema changes aren't tracked as migration files in this repo.

## 10. Near-term Roadmap (suggested, not committed)

1. Wire Replace BG / Cleanup / Uncrop to real models (likely HF Inference or a paid provider for inpainting-quality results).
2. Either wire Content Studio to the existing `/api/caption` route, or remove the unused route.
3. Add a `supabase/migrations` folder and start tracking schema changes in git.
4. Stripe integration for real plan upgrades/billing.
5. Consider a dedicated product-relighting/compositing model (e.g., via Fal.ai) if scene-composite realism becomes a recurring complaint — noted tradeoff: better edge/light quality, added per-request cost, does not solve the multi-object limitation.
