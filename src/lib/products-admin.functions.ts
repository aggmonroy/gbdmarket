import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  brand: z.string().max(80).optional().nullable(),
  model: z.string().max(80).optional().nullable(),
  code: z.string().max(80).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  price_cash: z.number().nonnegative(),
  price_financed: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()).optional().nullable(),
  datasheet_url: z.string().url().optional().nullable().or(z.literal("")),
  manual_url: z.string().url().optional().nullable().or(z.literal("")),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  publish: z.boolean().optional().default(true),
});

export const listAllProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { publish, id, ...rest } = data;
    const payload = {
      ...rest,
      datasheet_url: rest.datasheet_url || null,
      manual_url: rest.manual_url || null,
      images: rest.images ?? [],
      features: rest.features ?? [],
    };

    let row: any;
    if (publish) {
      const finalPayload = { ...payload, draft_data: null, has_draft: false };
      const res = id
        ? await supabaseAdmin.from("products").update(finalPayload).eq("id", id).select().single()
        : await supabaseAdmin.from("products").insert(finalPayload).select().single();
      if (res.error) throw new Error(res.error.message);
      row = res.data;
    } else {
      if (!id) {
        // Create hidden shell then attach draft
        const insertRes = await supabaseAdmin
          .from("products")
          .insert({ ...payload, is_published: false })
          .select()
          .single();
        if (insertRes.error) throw new Error(insertRes.error.message);
        const updateRes = await supabaseAdmin
          .from("products")
          .update({ draft_data: payload, has_draft: true })
          .eq("id", insertRes.data.id)
          .select()
          .single();
        row = updateRes.data;
      } else {
        const res = await supabaseAdmin
          .from("products")
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
      entity_type: "product",
      entity_id: row?.id,
      action: publish ? (id ? "update" : "create") : "draft",
      summary: `${publish ? "Guardó" : "Guardó borrador de"} "${payload.name}"`,
      changes: payload,
      user_id: context.userId,
      user_email: email,
    });
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "product",
      entity_id: data.id,
      action: "delete",
      user_id: context.userId,
      user_email: email,
    });
    return { ok: true };
  });

/**
 * Bulk import products from CSV rows. Rows with a SKU/code that matches an
 * existing product are updated (upsert by code). Rows without a code are
 * inserted as new. Returns per-row stats.
 */
export const bulkImportProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rows: any[] }) =>
    z.object({ rows: z.array(z.record(z.string(), z.any())).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { logAudit, resolveUserEmail } = await import("./audit.server");

    const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name");
    const catBySlug = new Map((cats ?? []).map((c: any) => [c.slug.toLowerCase(), c.id]));
    const catByName = new Map((cats ?? []).map((c: any) => [c.name.toLowerCase(), c.id]));

    const toNum = (v: any) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(String(v).replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const toArr = (v: any): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map(String);
      return String(v).split(/[|;\n]/).map((s) => s.trim()).filter(Boolean);
    };
    const get = (row: any, ...keys: string[]) => {
      for (const k of keys) {
        for (const rk of Object.keys(row)) {
          if (rk.toLowerCase().trim() === k.toLowerCase()) return row[rk];
        }
      }
      return undefined;
    };

    let created = 0;
    let updated = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const catRaw = String(get(row, "categoria", "category", "categoría") ?? "").trim().toLowerCase();
      const category_id = catBySlug.get(catRaw) ?? catByName.get(catRaw) ?? null;
      const code = ((get(row, "sku", "codigo", "código", "code") ?? "") as string).toString().trim() || null;
      const name = String(get(row, "nombre", "name", "producto") ?? "").trim();
      if (!name) {
        errors.push({ row: i + 2, error: "Falta el nombre" });
        continue;
      }
      const payload = {
        name: name.slice(0, 200),
        brand: (get(row, "marca", "brand") ?? null) || null,
        model: (get(row, "modelo", "model") ?? null) || null,
        code,
        category_id,
        description: (get(row, "descripcion", "descripción", "description") ?? null) || null,
        features: toArr(get(row, "caracteristicas", "características", "features", "especificaciones")),
        price_cash: toNum(get(row, "precio", "price", "price_cash", "precio_contado")),
        price_financed: (() => {
          const v = get(row, "precio_financiado", "price_financed");
          return v ? toNum(v) : null;
        })(),
        stock: Math.max(0, Math.round(toNum(get(row, "stock", "existencia", "cantidad")))),
        images: toArr(get(row, "imagen", "imagenes", "imágenes", "image", "images")),
        is_featured: ["1", "true", "si", "sí", "yes"].includes(
          String(get(row, "destacado", "featured") ?? "").toLowerCase(),
        ),
        is_published: !["0", "false", "no", "inactivo"].includes(
          String(get(row, "publicado", "published", "activo", "estado") ?? "true").toLowerCase(),
        ),
      };
      try {
        if (code) {
          const { data: existing } = await supabaseAdmin
            .from("products")
            .select("id")
            .eq("code", code)
            .maybeSingle();
          if (existing) {
            const { error } = await supabaseAdmin.from("products").update(payload).eq("id", existing.id);
            if (error) throw error;
            updated++;
          } else {
            const { error } = await supabaseAdmin.from("products").insert(payload);
            if (error) throw error;
            created++;
          }
        } else {
          const { error } = await supabaseAdmin.from("products").insert(payload);
          if (error) throw error;
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message ?? String(e) });
      }
    }

    const email = await resolveUserEmail(supabaseAdmin, context.userId);
    await logAudit(supabaseAdmin, {
      entity_type: "product",
      action: "bulk_import",
      summary: `Importación CSV: ${created} creados, ${updated} actualizados, ${errors.length} errores`,
      changes: { created, updated, errors },
      user_id: context.userId,
      user_email: email,
    });
    return { created, updated, errors };
  });
