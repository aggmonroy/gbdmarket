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

const schema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(120),
  section: z.string().min(1).max(60).default("general"),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(300).optional().nullable(),
  body: z.string().max(4000).optional().nullable(),
  image_url: z.string().max(600).optional().nullable(),
  cta_label: z.string().max(80).optional().nullable(),
  cta_url: z.string().max(400).optional().nullable(),
  is_active: z.boolean(),
  display_order: z.number().int().nonnegative(),
});

/** Public: list active blocks, optional section filter. */
export const listActiveBlocks = createServerFn({ method: "GET" })
  .inputValidator((d: { section?: string }) => z.object({ section: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    let q = sb.from("content_blocks").select("*").eq("is_active", true).order("display_order");
    if (data.section) q = q.eq("section", data.section);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const listAllBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("content_blocks")
      .select("*")
      .order("section")
      .order("display_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = data.id
      ? await supabaseAdmin.from("content_blocks").update(data).eq("id", data.id).select().single()
      : await supabaseAdmin.from("content_blocks").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("content_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
