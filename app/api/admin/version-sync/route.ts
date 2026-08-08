import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import pkg from "@/package.json";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

/** Vercel injects VERCEL_GIT_COMMIT_* automatically for every deployment — no
 * custom build step needed. But a raw commit SHA/message is written for
 * developers, not customers: the version number instead comes from
 * package.json (a real semver the team bumps deliberately), and only the
 * commit's first line is surfaced, stripped of its conventional-commit
 * prefix, as a starting draft — the admin still rewrites it in plain
 * language before publishing. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE;
  if (!rawMessage) {
    return NextResponse.json(
      { error: "No deploy info available (are you testing locally?)" },
      { status: 404 }
    );
  }

  const subject = rawMessage
    .split("\n")[0]
    .replace(/^\w+(\([^)]*\))?:\s*/, "") // strip "fix: " / "feat(x): " prefix
    .trim();

  return NextResponse.json({
    versionLabel: pkg.version,
    message: subject,
  });
}
