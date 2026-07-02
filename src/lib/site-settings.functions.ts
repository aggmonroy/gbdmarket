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

/** Admin: upsert a settings key. */
export const upsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: Record<string, any> }) =>
    z.object({ key: z.string().min(1).max(80), value: z.record(z.string(), z.any()) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
