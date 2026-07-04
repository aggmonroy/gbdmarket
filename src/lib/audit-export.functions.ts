import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const filterSchema = z.object({
  entity_type: z.string().max(40).optional(),
  action: z.string().max(40).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  user_email: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(5000).optional(),
});

async function query(context: any, filters: z.infer<typeof filterSchema>) {
  await assertAdmin(context.supabase, context.userId);
  const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
  const supabaseAdmin: any = sbAdmin;
  let q = supabaseAdmin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 1000);
  if (filters.entity_type) q = q.eq("entity_type", filters.entity_type);
  if (filters.action) q = q.eq("action", filters.action);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  if (filters.user_email) q = q.ilike("user_email", `%${filters.user_email}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Export the audit log as JSON (returned as a string, base64-safe UTF-8). */
export const exportAuditJson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const rows = await query(context, data);
    return { filename: `audit-${new Date().toISOString().slice(0, 10)}.json`, contents: JSON.stringify(rows, null, 2) };
  });

/** Export the audit log as CSV. */
export const exportAuditCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const rows = await query(context, data);
    const headers = ["created_at", "user_email", "user_id", "entity_type", "entity_id", "action", "summary", "changes"];
    const escape = (v: any) => {
      if (v == null) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const body = rows.map((r: any) => headers.map((h) => escape(r[h])).join(",")).join("\n");
    const csv = headers.join(",") + "\n" + body;
    return { filename: `audit-${new Date().toISOString().slice(0, 10)}.csv`, contents: csv };
  });
