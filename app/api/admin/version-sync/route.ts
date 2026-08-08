import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/admin-config";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

/** Vercel injects these automatically for every deployment — no custom build
 * step needed to know what commit is live. Only set on Vercel, so this route
 * returns nulls when run locally. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE;

  if (!sha) {
    return NextResponse.json(
      { error: "No deploy info available (are you testing locally?)" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    versionLabel: sha.slice(0, 7),
    message: message || "",
  });
}
