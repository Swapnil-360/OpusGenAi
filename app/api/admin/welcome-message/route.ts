import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAILS } from "@/lib/admin-config";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { useDefault, message } = await req.json();

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .upsert({
      id: "welcome_message",
      value: {
        useDefault: typeof useDefault === "boolean" ? useDefault : true,
        message: typeof message === "string" ? message : "",
      },
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Admin welcome-message update error:", error.message);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
