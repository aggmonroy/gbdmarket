import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Public: fetch a single settings key (returns value or null). */
export const getSetting = createServerFn({ method: "GET" })
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb.from("site_settings").select("value").eq("key", data.key).maybeSingle();
    return (row?.value ?? null) as Record<string, any> | null;
  });

/** Public: fetch all settings as a map. */
export const getAllSettingsPublic = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("site_settings").select("key,value");
  const map: Record<string, any> = {};
  for (const r of data ?? []) map[(r as any).key] = (r as any).value;
  return map;
});

/** Admin: read merged (draft over published) settings for preview + admin forms. */
export const getAllSettingsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { data } = await supabaseAdmin.from("site_settings").select("key,value,draft_value,has_draft");
    return (data ?? []) as Array<{ key: string; value: any; draft_value: any; has_draft: boolean }>;
  });

/** Admin: upsert a settings key. `publish=false` writes to draft. */
export const upsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: Record<string, any>; publish?: boolean }) =>
    z
      .object({
        key: z.string().min(1).max(80),
        value: z.record(z.string(), z.any()),
        publish: z.boolean().optional().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");

    const { data: existing } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();

    const payload = data.publish
      ? { key: data.key, value: data.value, draft_value: null, has_draft: false }
      : existing
        ? { key: data.key, draft_value: data.value, has_draft: true }
        : { key: data.key, value: {}, draft_value: data.value, has_draft: true };

    const { data: row, error } = await supabaseAdmin
      .from("site_settings")
      .upsert(payload, { onConflict: "key" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "site_setting",
      entity_id: data.key,
      action: data.publish ? "update" : "draft",
      summary: `${data.publish ? "Actualizó" : "Guardó borrador de"} ajuste ${data.key}`,
      changes: data.value,
      user_id: context.userId,
      user_email: email,
    });
    return row;
  });
