import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/admin-config";

/**
 * The signed-in user if they're an admin, otherwise null.
 *
 * The older admin routes each inline a boolean-returning version of this;
 * routes that need the user's own id (e.g. listing the admin's generations)
 * need the user object back, not just a yes/no.
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email || !(ADMIN_EMAILS as readonly string[]).includes(email)) return null;
  return user;
}
