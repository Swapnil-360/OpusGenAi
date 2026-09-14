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

    // 2. Clear browser client session immediately (scope: "local" avoids waiting for network)
    const supabase = createClient();
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("Local signOut warning:", e);
    }

    // 3. Clear server cookies with a short timeout race (prevents UI delay if Supabase/network is slow)
    try {
      await Promise.race([
        fetch("/auth/signout", { method: "POST", cache: "no-store" }),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    } catch {
      // Ignore network errors/timeouts
    }
  } finally {
    // 4. Hard redirect to /login to ensure clean state and avoid Next.js client-router cache traps
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }
}
