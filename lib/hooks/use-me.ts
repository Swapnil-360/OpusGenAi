"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/plans";

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  credits: number;
  plan: Plan;
  totalGenerations: number;
  standardVideosUsed: number;
  isAdmin: boolean;
  notificationPrefs: Record<string, boolean> | null;
}

/**
 * Shared /api/me cache, module-scoped so every component sharing this
 * browser tab reads and writes the same snapshot instead of each one
 * fetching independently.
 *
 * Before this hook, the dashboard layout, /account, /templates, /generate,
 * and the video generator each ran their own `fetch("/api/me")` on mount —
 * five separate call sites re-running the same 4-query server round trip
 * (profile, generation count, notification prefs, standard-video count) on
 * every dashboard navigation, even though the layout had *just* fetched the
 * exact same data seconds earlier. That redundancy is also how the sidebar
 * ended up with a stale, hardcoded `plan: "free"` (see git history) instead
 * of ever reading the real value — a second, independently-maintained copy
 * of the same response that nobody kept in sync.
 *
 * This does NOT change what's cached or for how long — credits/plan still
 * come from a real, uncached `fetch(..., { cache: "no-store" })` on every
 * mount (see fetchMe below), consistent with lib/cache.ts's rule that
 * money-affecting values are never given a TTL. What it removes is the
 * *redundant* fetches: a component mounting while another already has a
 * fresh-enough snapshot renders that snapshot immediately (no loading
 * flash on navigation) while still kicking off its own revalidation in the
 * background, so the value shown is never more than one round trip stale
 * and self-corrects within moments. Nothing that decides an actual charge
 * reads from this cache — every paid route re-derives credits from the DB
 * itself, and preflight checks that must be maximally fresh (e.g.
 * remove-bg's "can they even afford this?" check right before submitting)
 * intentionally keep their own direct, uncached fetch rather than use this.
 */

type MeState = { me: MeResponse | null; unauthorized: boolean };

let state: MeState = { me: null, unauthorized: false };
let inflight: Promise<MeState> | null = null;
const listeners = new Set<(s: MeState) => void>();

function setState(next: MeState) {
  state = next;
  listeners.forEach((l) => l(next));
}

async function fetchMe(): Promise<MeState> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) {
        const next: MeState = { me: null, unauthorized: true };
        setState(next);
        return next;
      }
      if (!res.ok) return state; // transient failure — keep whatever we had
      const me = (await res.json()) as MeResponse;
      const next: MeState = { me, unauthorized: false };
      setState(next);
      return next;
    } catch {
      return state;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Applies a locally-known credit change immediately (e.g. right after a
 *  paid action succeeds) without waiting for a full refetch. Every page that
 *  spends credits already does `window.dispatchEvent(new CustomEvent(
 *  "opusgen:credits", { detail: newBalance }))` on success — useMe() listens
 *  for that same event, so this now reaches every consumer of the shared
 *  cache, not just whichever single component used to hold its own copy. */
function setCachedCredits(credits: number) {
  if (!state.me) return;
  setState({ ...state, me: { ...state.me, credits } });
}

export function useMe() {
  const [s, setS] = useState<MeState>(state);
  const [loading, setLoading] = useState(state.me === null && !state.unauthorized);

  useEffect(() => {
    let mounted = true;
    const listener = (next: MeState) => { if (mounted) setS(next); };
    listeners.add(listener);
    // Always revalidates in the background, even on a cache hit — this is
    // stale-while-revalidate, not a TTL. See file header for why that's
    // still safe for the money-affecting fields.
    fetchMe().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; listeners.delete(listener); };
  }, []);

  useEffect(() => {
    function onCredits(e: Event) {
      const credits = (e as CustomEvent<number>).detail;
      if (typeof credits === "number") setCachedCredits(credits);
    }
    window.addEventListener("opusgen:credits", onCredits);
    return () => window.removeEventListener("opusgen:credits", onCredits);
  }, []);

  return { me: s.me, unauthorized: s.unauthorized, loading, refresh: fetchMe };
}
