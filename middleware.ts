import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { get as getEdgeConfig } from "@vercel/edge-config";
import { ADMIN_EMAILS } from "@/lib/admin-config";

// Paths that stay reachable during a maintenance-mode outage — the admin
// panel (so an admin can turn it back off) and the login flow that gets
// them there. Everything else gets the maintenance response, unconditionally,
// checked before any Supabase call: maintenance mode must keep working even
// if Supabase itself is what's down.
const MAINTENANCE_ALLOWED = ["/adminopusgenai", "/api/admin", "/login", "/auth/callback"];

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OpusGen AI — Down for maintenance</title>
</head>
<body style="margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0f0404; color:rgba(255,255,255,0.9); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="text-align:center; padding:24px; max-width:420px;">
    <img src="https://www.opusgenai.com/logo/OpusGen%20Ai(Orange).png" alt="OpusGen AI" width="150" style="display:block; margin:0 auto 28px; max-width:150px; height:auto;">
    <h1 style="margin:0 0 10px; font-size:20px; font-weight:800;">We&#39;ll be back shortly</h1>
    <p style="margin:0; font-size:14px; line-height:1.6; color:rgba(255,255,255,0.55);">
      OpusGen AI is temporarily down for maintenance. We&#39;re working on it — check back in a few minutes.
    </p>
  </div>
</body>
</html>`;

function maintenanceResponse() {
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": "1800",
      "Cache-Control": "no-store",
    },
  });
}

const PROTECTED_PATHS = [
  "/generate",
  "/studio",
  "/history",
  "/account",
  "/templates",
];

const ADMIN_PATHS = ["/adminopusgenai", "/api/admin"];

const AUTH_PATHS = ["/login", "/signup"];

const MFA_CHALLENGE_PATH = "/mfa-challenge";

export async function middleware(request: NextRequest) {
  const { pathname: requestPath } = request.nextUrl;
  if (!MAINTENANCE_ALLOWED.some((p) => requestPath.startsWith(p))) {
    let underMaintenance = false;
    try {
      underMaintenance = (await getEdgeConfig<boolean>("maintenance")) === true;
    } catch {
      // Edge Config unreachable — fail open rather than taking the whole
      // site down over a flag-store hiccup unrelated to the app itself.
    }
    if (underMaintenance) return maintenanceResponse();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirects build a fresh NextResponse, which would otherwise drop any
  // refreshed session cookies that getUser() just wrote onto supabaseResponse.
  function redirect(url: URL) {
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  }

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.includes(pathname);

  const isDev = process.env.NODE_ENV === "development";

  // Admin routes are never bypassed in dev, and require the verified session
  // email (not a client-supplied one) to be on the server-only allowlist.
  if (isAdminPath) {
    const email = user?.email?.toLowerCase();
    const isAdmin = !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = user ? "/generate" : "/login";
      if (!user) url.searchParams.set("redirectTo", pathname);
      return redirect(url);
    }
    return supabaseResponse;
  }

  if (isProtected && !user && !isDev) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/generate";
    url.searchParams.delete("redirectTo");
    return redirect(url);
  }

  // Step-up auth: a user who has enrolled a verified TOTP factor but hasn't
  // completed the challenge yet sits at aal1 while a verified factor demands
  // aal2 (nextLevel). Gate protected routes behind /mfa-challenge until they do.
  if (user && !isDev) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsStepUp = !!aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel;

    if (needsStepUp && isProtected && pathname !== MFA_CHALLENGE_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = MFA_CHALLENGE_PATH;
      url.searchParams.set("redirectTo", pathname);
      return redirect(url);
    }

    if (!needsStepUp && pathname === MFA_CHALLENGE_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("redirectTo") || "/generate";
      url.searchParams.delete("redirectTo");
      return redirect(url);
    }
  } else if (!user && pathname === MFA_CHALLENGE_PATH && !isDev) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|tools/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
