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
  publish: z.boolean().optional().default(true),
});

/** Public: list active blocks (published values only). */
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
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
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
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { publish, id, ...fields } = data;

    let row: any;
    if (publish) {
      const payload = { ...fields, draft_data: null, has_draft: false };
      const res = id
        ? await supabaseAdmin.from("content_blocks").update(payload).eq("id", id).select().single()
        : await supabaseAdmin.from("content_blocks").insert(payload).select().single();
      if (res.error) throw new Error(res.error.message);
      row = res.data;
    } else {
      // Draft flow: require an existing row (creating always publishes so it's visible in admin lists)
      if (!id) {
        const insertRes = await supabaseAdmin.from("content_blocks").insert({ ...fields, is_active: false }).select().single();
        if (insertRes.error) throw new Error(insertRes.error.message);
        const updateRes = await supabaseAdmin
          .from("content_blocks")
          .update({ draft_data: fields, has_draft: true })
          .eq("id", insertRes.data.id)
          .select()
          .single();
        row = updateRes.data;
      } else {
        const res = await supabaseAdmin
          .from("content_blocks")
          .update({ draft_data: fields, has_draft: true })
          .eq("id", id)
          .select()
          .single();
        if (res.error) throw new Error(res.error.message);
        row = res.data;
      }
    }

    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "content_block",
      entity_id: row?.id,
      action: publish ? (id ? "update" : "create") : "draft",
      summary: `${publish ? "Guardó" : "Guardó borrador de"} bloque ${fields.key}`,
      changes: fields,
      user_id: context.userId,
      user_email: email,
    });
    return row;
  });

export const deleteBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { error } = await supabaseAdmin.from("content_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "content_block",
      entity_id: data.id,
      action: "delete",
      user_id: context.userId,
      user_email: email,
    });
    return { ok: true };
  });
