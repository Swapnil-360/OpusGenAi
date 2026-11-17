import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["Brand", "Agency", "Seller"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, role } = body;

    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const cleanRole = typeof role === "string" ? role.trim() : "";

    // Email validation
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Role validation
    if (!VALID_ROLES.includes(cleanRole as ValidRole)) {
      return NextResponse.json(
        { error: "Please select a valid option (Brand, Agency, or Seller)." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const normalizedEmail = trimmedEmail.toLowerCase();
    const nowIso = new Date().toISOString();

    let saved = false;

    // 1. Try inserting/upserting to waitlist table
    const { error: dbError } = await admin
      .from("waitlist")
      .upsert(
        {
          email: normalizedEmail,
          role: cleanRole,
          source: "coming_soon",
        },
        { onConflict: "email" }
      );

    if (!dbError) {
      saved = true;
    }

    // 2. Also persist in site_settings as guaranteed fallback (or if table is not yet migrated)
    try {
      const { data: settingData } = await admin
        .from("site_settings")
        .select("value")
        .eq("id", "coming_soon_waitlist")
        .single();

      let entries: Array<{
        id: string;
        email: string;
        role: string;
        source: string;
        created_at: string;
      }> = [];

      if (settingData?.value && typeof settingData.value === "object") {
        const val = settingData.value as { entries?: typeof entries };
        if (Array.isArray(val.entries)) {
          entries = val.entries;
        }
      }

      const existingIdx = entries.findIndex(
        (e) => e.email.toLowerCase() === normalizedEmail
      );

      if (existingIdx >= 0) {
        entries[existingIdx].role = cleanRole;
      } else {
        entries.unshift({
          id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          email: normalizedEmail,
          role: cleanRole,
          source: "coming_soon",
          created_at: nowIso,
        });
      }

      const { error: settingError } = await admin
        .from("site_settings")
        .upsert(
          {
            id: "coming_soon_waitlist",
            value: { entries },
            updated_at: nowIso,
          },
          { onConflict: "id" }
        );

      if (!settingError) {
        saved = true;
      }
    } catch (fallbackErr) {
      console.warn("Fallback waitlist persistence notice:", fallbackErr);
    }

    if (!saved) {
      console.error("Waitlist signup error:", dbError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list. We'll email you when it's ready.",
    });
  } catch (err) {
    console.error("Unexpected error in waitlist route:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
