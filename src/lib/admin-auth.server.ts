// Server-only helpers for admin authorisation (roles).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AdminRole } from "./admin-auth.functions";

/** Highest-privilege role of a user, or null when the user has no staff role. */
export async function getRoleFor(userId: string): Promise<AdminRole | null> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role as AdminRole);
  for (const r of ["admin", "editor", "viewer", "user"] as const) {
    if (roles.includes(r)) return r;
  }
  return null;
}
