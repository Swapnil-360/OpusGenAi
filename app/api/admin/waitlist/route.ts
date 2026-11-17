import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .select("id, email, role, source, created_at")
    .order("created_at", { ascending: false });

  if (!error && data && data.length > 0) {
    return NextResponse.json({ waitlist: data });
  }

  // Fallback to site_settings if table not created yet or empty
  try {
    const { data: settingData } = await admin
      .from("site_settings")
      .select("value")
      .eq("id", "coming_soon_waitlist")
      .single();

    if (settingData?.value && typeof settingData.value === "object") {
      const val = settingData.value as {
        entries?: Array<{
          id: string;
          email: string;
          role: string;
          source: string;
          created_at: string;
        }>;
      };
      if (Array.isArray(val.entries)) {
        return NextResponse.json({ waitlist: val.entries });
      }
    }
  } catch (fallbackErr) {
    console.warn("Fallback waitlist fetch notice:", fallbackErr);
  }

  if (error && error.code !== "PGRST205") {
    console.error("Admin waitlist fetch error:", error.message);
    return NextResponse.json(
      { error: "Failed to load waitlist entries" },
      { status: 500 }
    );
  }

  return NextResponse.json({ waitlist: data ?? [] });
}
