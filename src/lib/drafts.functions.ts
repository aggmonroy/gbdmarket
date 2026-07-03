import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const ENTITY_TABLE: Record<string, { table: string; draftCol: string; idCol: string }> = {
  product: { table: "products", draftCol: "draft_data", idCol: "id" },
  content_block: { table: "content_blocks", draftCol: "draft_data", idCol: "id" },
  promotion: { table: "promotions", draftCol: "draft_data", idCol: "id" },
  site_setting: { table: "site_settings", draftCol: "draft_value", idCol: "key" },
};

/** List all rows across entity types that have a pending draft. */
export const listPendingDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: Array<{
      entity_type: string;
      entity_id: string;
      title: string;
      draft: any;
      updated_at: string;
    }> = [];
    const [prod, blk, prm, set] = await Promise.all([
      supabaseAdmin.from("products").select("id,name,draft_data,updated_at").eq("has_draft", true),
      supabaseAdmin.from("content_blocks").select("id,key,section,draft_data,updated_at").eq("has_draft", true),
      supabaseAdmin.from("promotions").select("id,title,draft_data,updated_at").eq("has_draft", true),
      supabaseAdmin.from("site_settings").select("key,draft_value,updated_at").eq("has_draft", true),
    ]);
    (prod.data ?? []).forEach((r: any) =>
      out.push({ entity_type: "product", entity_id: r.id, title: r.name, draft: r.draft_data, updated_at: r.updated_at }),
    );
    (blk.data ?? []).forEach((r: any) =>
      out.push({
        entity_type: "content_block",
        entity_id: r.id,
        title: `${r.section} · ${r.key}`,
        draft: r.draft_data,
        updated_at: r.updated_at,
      }),
    );
    (prm.data ?? []).forEach((r: any) =>
      out.push({ entity_type: "promotion", entity_id: r.id, title: r.title, draft: r.draft_data, updated_at: r.updated_at }),
    );
    (set.data ?? []).forEach((r: any) =>
      out.push({
        entity_type: "site_setting",
        entity_id: r.key,
        title: `Ajuste: ${r.key}`,
        draft: r.draft_value,
        updated_at: r.updated_at,
      }),
    );
    return out.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  });

const actSchema = z.object({
  entity_type: z.enum(["product", "content_block", "promotion", "site_setting"]),
  entity_id: z.string().min(1),
});

/** Publish a single draft: merge draft into main columns, clear draft flags. */
export const publishDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const cfg = ENTITY_TABLE[data.entity_type];
    if (!cfg) throw new Error("Tipo no soportado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit, resolveUserEmail } = await import("./audit.server");

    const { data: row, error: rErr } = await supabaseAdmin
      .from(cfg.table)
      .select("*")
      .eq(cfg.idCol, data.entity_id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!row) throw new Error("Registro no encontrado");
    const draft = (row as any)[cfg.draftCol];
    if (!draft) throw new Error("No hay borrador para publicar");

    const patch: any = { ...draft, has_draft: false, [cfg.draftCol]: null };
    const { error: uErr } = await supabaseAdmin
      .from(cfg.table)
      .update(patch)
      .eq(cfg.idCol, data.entity_id);
    if (uErr) throw new Error(uErr.message);

    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action: "publish",
      summary: `Publicó cambios en ${data.entity_type}`,
      changes: draft,
      user_id: context.userId,
      user_email: email,
    });
    return { ok: true };
  });

/** Discard the pending draft on an entity. */
export const discardDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const cfg = ENTITY_TABLE[data.entity_type];
    if (!cfg) throw new Error("Tipo no soportado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { error } = await supabaseAdmin
      .from(cfg.table)
      .update({ has_draft: false, [cfg.draftCol]: null })
      .eq(cfg.idCol, data.entity_id);
    if (error) throw new Error(error.message);
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action: "discard_draft",
      summary: `Descartó borrador de ${data.entity_type}`,
      user_id: context.userId,
      user_email: email,
    });
    return { ok: true };
  });

/** Publish all pending drafts at once. */
export const publishAllDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    let published = 0;
    for (const [type, cfg] of Object.entries(ENTITY_TABLE)) {
      const { data: rows } = await supabaseAdmin
        .from(cfg.table)
        .select(`${cfg.idCol}, ${cfg.draftCol}`)
        .eq("has_draft", true);
      for (const row of rows ?? []) {
        const draft = (row as any)[cfg.draftCol];
        if (!draft) continue;
        const patch: any = { ...draft, has_draft: false, [cfg.draftCol]: null };
        await supabaseAdmin
          .from(cfg.table)
          .update(patch)
          .eq(cfg.idCol, (row as any)[cfg.idCol]);
        published++;
      }
    }
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "batch",
      action: "publish_all",
      summary: `Publicó ${published} borradores`,
      user_id: context.userId,
      user_email: email,
    });
    return { published };
  });

/** Read the audit log (admin only). */
export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number; entityType?: string } = {}) =>
    z
      .object({
        limit: z.number().int().min(1).max(500).optional(),
        entityType: z.string().max(40).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.entityType) q = q.eq("entity_type", data.entityType);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
