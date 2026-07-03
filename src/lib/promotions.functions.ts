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
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional().nullable(),
  discount_pct: z.number().min(0).max(100),
  starts_at: z.string().datetime().optional().nullable().or(z.literal("")),
  ends_at: z.string().datetime().optional().nullable().or(z.literal("")),
  product_ids: z.array(z.string().uuid()).default([]),
  image_url: z.string().max(600).optional().nullable(),
  is_active: z.boolean(),
  publish: z.boolean().optional().default(true),
});

export const listActivePromotions = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const nowIso = new Date().toISOString();
  const { data } = await sb
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const listAllPromotions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { data, error } = await supabaseAdmin.from("promotions").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { publish, id, ...raw } = data;
    const payload = { ...raw, starts_at: raw.starts_at || null, ends_at: raw.ends_at || null };

    let row: any;
    if (publish) {
      const finalPayload = { ...payload, draft_data: null, has_draft: false };
      const res = id
        ? await supabaseAdmin.from("promotions").update(finalPayload).eq("id", id).select().single()
        : await supabaseAdmin.from("promotions").insert(finalPayload).select().single();
      if (res.error) throw new Error(res.error.message);
      row = res.data;
    } else {
      if (!id) {
        const insertRes = await supabaseAdmin.from("promotions").insert({ ...payload, is_active: false }).select().single();
        if (insertRes.error) throw new Error(insertRes.error.message);
        const updateRes = await supabaseAdmin
          .from("promotions")
          .update({ draft_data: payload, has_draft: true })
          .eq("id", insertRes.data.id)
          .select()
          .single();
        row = updateRes.data;
      } else {
        const res = await supabaseAdmin
          .from("promotions")
          .update({ draft_data: payload, has_draft: true })
          .eq("id", id)
          .select()
          .single();
        if (res.error) throw new Error(res.error.message);
        row = res.data;
      }
    }
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "promotion",
      entity_id: row?.id,
      action: publish ? (id ? "update" : "create") : "draft",
      summary: `${publish ? "Guardó" : "Guardó borrador de"} promoción "${raw.title}"`,
      changes: payload,
      user_id: context.userId,
      user_email: email,
    });
    return row;
  });

export const deletePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { error } = await supabaseAdmin.from("promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "promotion",
      entity_id: data.id,
      action: "delete",
      user_id: context.userId,
      user_email: email,
    });
    return { ok: true };
  });
