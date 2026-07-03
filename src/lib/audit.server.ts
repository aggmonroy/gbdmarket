// Server-only helper to write audit entries. Never import from client-reachable
// modules at top level; use dynamic import from *.functions.ts handlers.
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEntry = {
  entity_type: string;
  entity_id?: string | null;
  action: string;
  summary?: string | null;
  changes?: Record<string, any> | null;
  user_id?: string | null;
  user_email?: string | null;
};

export async function logAudit(supabaseAdmin: SupabaseClient<any, any, any>, entry: AuditEntry) {
  try {
    await supabaseAdmin.from("audit_log").insert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      summary: entry.summary ?? null,
      changes: entry.changes ?? null,
      user_id: entry.user_id ?? null,
      user_email: entry.user_email ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to log", e);
  }
}

export async function resolveUserEmail(
  supabaseAdmin: SupabaseClient<any, any, any>,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}
