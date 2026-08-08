import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS, type BannerMode } from "@/lib/admin-config";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

const VALID_MODES: BannerMode[] = ["normal", "maintenance", "coming_soon", "new_version", "custom"];

// Resource identifiers, not secrets — safe to commit. Only the write token
// (VERCEL_API_TOKEN) needs to stay in env vars.
const EDGE_CONFIG_ID = "ecfg_glstu3r5j7w7lm0uiulfxvj4h1yz";
const VERCEL_TEAM_ID = "team_8ADFjbFICNCJ439XeHQ5Yz7R";

/** Flips the real kill-switch middleware checks on every request. Failure
 * here is reported back to the admin rather than silently swallowed — a
 * maintenance toggle that looks saved but didn't take is worse than an
 * explicit error. */
async function setMaintenanceFlag(on: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return { ok: false, error: "VERCEL_API_TOKEN is not configured" };

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${VERCEL_TEAM_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ operation: "upsert", key: "maintenance", value: on }],
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Edge Config maintenance flag update failed:", res.status, detail);
    return { ok: false, error: `Edge Config update failed (${res.status})` };
  }
  return { ok: true };
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { mode, message, versionLabel } = await req.json();
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("site_settings")
    .upsert({
      id: "site_banner",
      value: {
        mode,
        message: typeof message === "string" ? message : "",
        versionLabel: typeof versionLabel === "string" ? versionLabel : "",
      },
      updated_at: new Date().toISOString(),
    });

  if (dbError) {
    console.error("Admin site-banner update error:", dbError.message);
    return NextResponse.json({ error: "Failed to save banner" }, { status: 500 });
  }

  const flag = await setMaintenanceFlag(mode === "maintenance");
  if (!flag.ok) {
    // Banner text saved fine; the actual site-lock did not. Surface this
    // distinctly — the admin needs to know the kill-switch itself didn't flip.
    return NextResponse.json(
      { ok: true, banner: true, maintenanceSwitch: false, error: flag.error },
      { status: 207 }
    );
  }

  return NextResponse.json({ ok: true, banner: true, maintenanceSwitch: true });
}
