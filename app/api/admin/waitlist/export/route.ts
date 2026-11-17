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

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  let rows: Array<{
    id: string;
    email: string;
    role: string;
    source?: string;
    created_at: string;
  }> = [];

  const { data, error } = await admin
    .from("waitlist")
    .select("id, email, role, source, created_at")
    .order("created_at", { ascending: false });

  if (!error && data && data.length > 0) {
    rows = data;
  } else {
    // Fallback to site_settings
    try {
      const { data: settingData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "coming_soon_waitlist")
        .single();

      if (settingData?.value && typeof settingData.value === "object") {
        const val = settingData.value as { entries?: typeof rows };
        if (Array.isArray(val.entries)) {
          rows = val.entries;
        }
      }
    } catch (fallbackErr) {
      console.warn("Fallback waitlist export notice:", fallbackErr);
    }
  }
  const header = ["ID", "Email", "Role (I am a)", "Source", "Signed Up At"];
  const csvLines = [header.map(escapeCsvField).join(",")];

  for (const row of rows) {
    csvLines.push(
      [
        row.id,
        row.email,
        row.role,
        row.source || "coming_soon",
        row.created_at,
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }

  const csvContent = csvLines.join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="opusgen-waitlist-${dateStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
