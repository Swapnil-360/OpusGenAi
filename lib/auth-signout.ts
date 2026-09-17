import { createClient } from "@/lib/supabase/client";
import { resetMeCache } from "@/lib/hooks/use-me";

let isSigningOut = false;

/**
 * Robust, instant sign-out utility.
 * - Prevents multiple concurrent clicks / race conditions.
 * - Instantly wipes in-memory user cache.
 * - Immediately invalidates local session tokens without blocking on network latency.
 * - Best-effort server cookie clearance via /auth/signout route.
 * - Hard navigates to /login to flush React state, memory, and ensure fresh middleware evaluation.
 */
export async function signOutUser() {
  if (isSigningOut) return;
  isSigningOut = true;

  try {
    // 1. Instantly clear client-side user cache
    resetMeCache();

    // 2. Clear browser local & session storage across all browsers
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("opusgen:active-tab");
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i);
          if (
            key &&
            (key.startsWith("sb-") ||
              key.includes("supabase") ||
              key.includes("opusgen"))
          ) {
            window.localStorage.removeItem(key);
          }
        }
        window.sessionStorage.clear();
      } catch (storageErr) {
        console.warn("Storage wipe warning:", storageErr);
      }

      // 3. Proactively expire client-accessible cookies
      if (typeof document !== "undefined") {
        try {
          const cookies = document.cookie.split(";");
          for (const c of cookies) {
            const eqPos = c.indexOf("=");
            const name = (eqPos > -1 ? c.substring(0, eqPos) : c).trim();
            if (
              name.startsWith("sb-") ||
              name.includes("auth-token") ||
              name.includes("supabase")
            ) {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax;`;
            }
          }
        } catch (cookieErr) {
          console.warn("Client cookie wipe warning:", cookieErr);
        }
      }
    }

    // 4. Invalidate local Supabase client state (non-blocking, local scope only)
    try {
      const supabase = createClient();
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    } catch (e) {
      console.warn("Local signOut warning:", e);
    }

    // 5. Invalidate server cookies via /auth/signout endpoint
    try {
      await Promise.race([
        fetch("/auth/signout", {
          method: "POST",
          headers: { Accept: "application/json" },
          cache: "no-store",
          credentials: "include",
        }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
    } catch {
      // Network hiccup — local storage and client cookies are already wiped
    }
  } finally {
    // 6. Hard redirect to /login to ensure clean state and avoid Next.js client-router cache traps
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    } else {
      isSigningOut = false;
    }
  }
}
