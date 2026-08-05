"use client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Reads a public table (RLS `select using (true)`) straight over PostgREST
 * with the anon key.
 *
 * Deliberately does NOT go through the supabase-js browser client. Once a user
 * is signed in, that client routes every request through a navigator.locks-
 * guarded token refresh — so a stalled refresh blocks unrelated public reads
 * indefinitely. That coupling is why the templates carousel and hero orbit
 * would hang after a hard refresh while signed in, but never when signed out.
 * These rows need no session, so they shouldn't wait on one.
 */
export async function selectPublic<T>(
  table: string,
  query: string,
  { timeoutMs = 8000 }: { timeoutMs?: number } = {}
): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Read of "${table}" failed (${res.status})`);
    return (await res.json()) as T[];
  } finally {
    clearTimeout(timer);
  }
}
