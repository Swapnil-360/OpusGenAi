import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

async function performSignOut(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out in /auth/signout route:", err);
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const isJsonExpected =
    req.headers.get("accept")?.includes("application/json") ||
    req.headers.get("sec-fetch-dest") === "empty";

  const res = isJsonExpected
    ? NextResponse.json({ ok: true, signedOut: true })
    : NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  // Explicitly invalidate all Supabase auth and session cookies across browsers
  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("auth-token") ||
      cookie.name.includes("supabase")
    ) {
      try {
        cookieStore.delete(cookie.name);
      } catch {
        // Ignored if called in an environment where direct delete is restricted
      }
      res.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
        expires: new Date(0),
        sameSite: "lax",
      });
    }
  }

  revalidatePath("/", "layout");
  return res;
}

export async function POST(req: NextRequest) {
  return performSignOut(req);
}

export async function GET(req: NextRequest) {
  return performSignOut(req);
}

