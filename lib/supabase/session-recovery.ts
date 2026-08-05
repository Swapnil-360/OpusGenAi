"use client";

const AUTH_TOKEN_KEY_PATTERN = /^sb-.*-auth-token$/;

/** Clears a stuck/corrupted local Supabase auth session — the same thing
 * manually clearing site data via DevTools was fixing, without requiring it. */
export function clearStaleSupabaseSession() {
  if (typeof window === "undefined") return;
  for (const key of Object.keys(window.localStorage)) {
    if (AUTH_TOKEN_KEY_PATTERN.test(key)) window.localStorage.removeItem(key);
  }
}

/** Races a Supabase query against a timeout. supabase-js's browser client
 * serializes every request behind a navigator.locks-guarded session refresh;
 * a corrupted/stuck local session can leave that lock held forever, hanging
 * every query on the page indefinitely. On timeout, clear the local session
 * (releasing the lock) so the caller can retry once against a clean state. */
export function withQueryTimeout<T extends { error: unknown }>(
  queryPromise: PromiseLike<T>,
  ms = 8000
): Promise<T | { data: null; error: { message: string } }> {
  return Promise.race([
    Promise.resolve(queryPromise),
    new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => {
        clearStaleSupabaseSession();
        resolve({ data: null, error: { message: "Request timed out." } });
      }, ms)
    ),
  ]);
}
