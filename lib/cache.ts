import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Application-level read cache, built on Next.js's own Data Cache
 * (`unstable_cache` + `revalidateTag`) rather than a new external service.
 *
 * Why not Redis/Upstash: this app has no existing cache infrastructure, and
 * on Vercel the Next.js Data Cache is already a shared, durable cache — it
 * is NOT per-instance process memory, so it survives serverless cold starts,
 * horizontal scaling, and instance replacement the same way ISR/ `fetch()`
 * revalidation does. Adding Redis for the two read patterns this app
 * actually needs cached (see route usage) would be new infra, new secrets,
 * and a new failure mode for no benefit over what the framework already
 * provides. If a future need genuinely outgrows this (cross-region
 * coordination stronger than tag-based revalidation, pub/sub invalidation,
 * etc.), `cachedQuery`/`invalidateTag` below are the only two functions
 * route code depends on — swapping the implementation is a one-file change.
 *
 * Explicitly NOT handled here — see callers, not this file, for why:
 *   - Credit balance and plan (lib/credits.ts, lib/entitlements.ts) are read
 *     fresh on every request. These gate money/entitlement decisions; this
 *     app was already burned once by trusting a cached/RPC-adjacent value
 *     for credits (see lib/credits.ts's decrement_credits comment), so
 *     nothing on that path is cached, full stop.
 *   - Per-user data (History, /api/me) is not cached — it's cheap indexed
 *     reads already, and a user expects to see their own just-created data
 *     immediately, which is exactly the case stale-while-revalidate exists
 *     to avoid.
 *   - Public landing-page reads (templates carousel, hero images) go
 *     straight from the browser to Supabase PostgREST with the anon key
 *     (lib/supabase/public-rest.ts), deliberately bypassing this app's
 *     server to avoid a documented session-lock stall. Routing them through
 *     a cached API route would undo that fix, so they're out of scope here.
 */

/**
 * TTL in seconds per cached resource. Overridable via env so ops can tune
 * without a redeploy of the calling code (the value is still read at request
 * time, since env vars don't change without a redeploy on Vercel anyway —
 * this is about not hardcoding magic numbers at call sites, not about
 * runtime-mutable config).
 */
export const CACHE_TTL = {
  /** Full template catalogue (all types) — admin-authored, rarely changes,
   *  identical response for every signed-in user. 30 min default. */
  templates: envInt("CACHE_TTL_TEMPLATES_SECONDS", 1800),
  /** Admin dashboard aggregate (full generations scan + full user list +
   *  an external fal.ai billing call) — a stats snapshot, not a ledger
   *  anything else depends on for correctness. 60s default. */
  adminOverview: envInt("CACHE_TTL_ADMIN_OVERVIEW_SECONDS", 60),
} as const;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Centralized cache tags — the only strings `revalidateTag` should ever be
 *  called with. Keeping them here (not inlined at call sites) is what makes
 *  "what invalidates what" auditable in one place. */
export const CACHE_TAGS = {
  templates: "templates",
  adminOverview: "admin-overview",
} as const;

/**
 * Bumped whenever a cached fetcher's *return shape* changes (columns added
 * to a select(), fields renamed on the returned object, etc.) — folded into
 * every cache key below. Without this, a route deployed with a new shape
 * could still read back an old-shaped object cached by the previous
 * deployment, which fails as a confusing `undefined` field deep in the
 * response rather than a clean error. Bump this, don't touch call sites.
 */
const CACHE_SCHEMA_VERSION = "v1";

/**
 * Cache-aside wrapper: returns a zero-arg function that serves from the
 * Next.js Data Cache on hit, and transparently falls back to calling `fetcher`
 * directly — bypassing the cache entirely — if the cache layer itself fails
 * for any reason, including failing to even set itself up. A caching bug
 * must never be able to take the app down; worst case here is the same DB
 * round trip callers would have made anyway if this cache didn't exist.
 * `unstable_cache()` itself is built lazily inside the returned function
 * (not eagerly at module load, where every route file calls this) so that a
 * setup-time failure is caught by the same try/catch as a read-time one,
 * instead of crashing the route module on import.
 *
 * `keyParts` must include every dimension that distinguishes this data (see
 * CACHE_TAGS usage at call sites) — there is deliberately no per-user
 * dimension anywhere in this file, because nothing routed through here
 * varies by user (checked at every call site before adding it).
 */
export function cachedQuery<T>(
  fetcher: () => Promise<T>,
  keyParts: string[],
  options: { tags: string[]; revalidateSeconds: number }
): () => Promise<T> {
  const fullKeyParts = [...keyParts, CACHE_SCHEMA_VERSION];
  let cached: (() => Promise<T>) | null = null;

  return async () => {
    try {
      if (!cached) {
        cached = unstable_cache(fetcher, fullKeyParts, {
          tags: options.tags,
          revalidate: options.revalidateSeconds,
        });
      }
      return await cached();
    } catch (err) {
      console.error(`cache read failed for [${fullKeyParts.join(":")}], falling back to direct fetch:`, err);
      return fetcher();
    }
  };
}

/** Invalidates one cache tag. Never throws — a failed invalidation should be
 *  logged and left to the TTL to self-heal, not turn a successful database
 *  mutation into a failed API response. */
function invalidateTag(tag: string): void {
  try {
    revalidateTag(tag);
  } catch (err) {
    console.error(`cache invalidation failed for tag "${tag}" (will self-heal via TTL):`, err);
  }
}

/**
 * Call after any successful create/update/delete on the templates table —
 * every admin template mutation route does. One shared tag because
 * /api/templates returns the full catalogue in a single unparameterized
 * query; there is no per-category or per-id cache entry to selectively bust.
 */
export function invalidateTemplatesCache(): void {
  invalidateTag(CACHE_TAGS.templates);
}
