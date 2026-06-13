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
});

export const listAllProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      ...data,
      datasheet_url: data.datasheet_url || null,
      manual_url: data.manual_url || null,
      images: data.images ?? [],
      features: data.features ?? [],
    };
    const { data: row, error } = data.id
      ? await supabaseAdmin.from("products").update(payload).eq("id", data.id).select().single()
      : await supabaseAdmin.from("products").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bulk import: rows are loose objects matching CSV columns. */
export const bulkImportProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rows: any[] }) =>
    z.object({ rows: z.array(z.record(z.string(), z.any())).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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

    const payload = data.rows.map((row) => {
      const catRaw = String(get(row, "categoria", "category", "categoría") ?? "").trim().toLowerCase();
      const category_id = catBySlug.get(catRaw) ?? catByName.get(catRaw) ?? null;
      return {
        name: String(get(row, "nombre", "name", "producto") ?? "Sin nombre").slice(0, 200),
        brand: (get(row, "marca", "brand") ?? null) || null,
        model: (get(row, "modelo", "model") ?? null) || null,
        code: (get(row, "sku", "codigo", "código", "code") ?? null) || null,
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
        is_published: !["0", "false", "no"].includes(
          String(get(row, "publicado", "published") ?? "true").toLowerCase(),
        ),
      };
    });

    const { error } = await supabaseAdmin.from("products").insert(payload);
    if (error) throw new Error(error.message);
    return { inserted: payload.length };
  });
