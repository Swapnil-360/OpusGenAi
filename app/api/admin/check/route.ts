import { NextResponse } from "next/server";

// Middleware already blocks non-admins with a 403 before this ever runs —
// reaching this handler at all means the caller is an authorized admin.
export async function GET() {
  return NextResponse.json({ isAdmin: true });
}
