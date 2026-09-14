import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out in /auth/signout route:", err);
  }

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out in /auth/signout route:", err);
  }

  revalidatePath("/", "layout");
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
