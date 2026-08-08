import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin, verifySesion } from "./garantias.server";

const productoPortalSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  code: z.string().trim().max(80).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  features: z.array(z.string().max(300)).max(40).optional(),
  price_cash: z.number().nonnegative(),
  price_financed: z.number().nonnegative().nullable().optional(),
  disponibilidad: z.enum(["en_stock", "bajo_pedido"]).default("en_stock"),
  images: z.array(z.string().max(2000)).max(10).optional(),
  datasheet_url: z.string().trim().max(2000).optional().or(z.literal("")),
  manual_url: z.string().trim().max(2000).optional().or(z.literal("")),
  is_published: z.boolean().default(true),
});

/** Catálogo visible para el portal, incluidas las categorías de bordados. */
export const listCatalogoPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(1), q: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const [{ data: cats }, prods] = await Promise.all([
      sb.from("categories").select("id,name,slug").order("display_order"),
      (async () => {
        let q: any = sb
          .from("products")
          .select("id,name,brand,model,code,category_id,price_cash,disponibilidad,is_published,images,created_at")
          .order("created_at", { ascending: false })
          .limit(300);
        if (data.q) q = q.or(`name.ilike.%${data.q}%,brand.ilike.%${data.q}%,code.ilike.%${data.q}%`);
        return q;
      })(),
    ]);
    if ((prods as any).error) throw new Error((prods as any).error.message);
    return { categorias: cats ?? [], productos: (prods as any).data ?? [] };
  });

/** Un colaborador puede crear y editar productos del catálogo. */
export const guardarProductoPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productoPortalSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { token, id, ...rest } = data;
    const payload = {
      name: rest.name,
      brand: rest.brand || null,
      model: rest.model || null,
      code: rest.code || null,
      category_id: rest.category_id || null,
      description: rest.description || null,
      features: rest.features ?? [],
      price_cash: rest.price_cash,
      price_financed: rest.price_financed ?? null,
      disponibilidad: rest.disponibilidad,
      stock: rest.disponibilidad === "en_stock" ? 1 : 0,
      images: rest.images ?? [],
      datasheet_url: rest.datasheet_url || null,
      manual_url: rest.manual_url || null,
      is_published: rest.is_published,
      has_draft: false,
      draft_data: null,
    };
    const res = id
      ? await sb.from("products").update(payload).eq("id", id).select("id").single()
      : await sb.from("products").insert(payload).select("id").single();
    if (res.error) throw new Error(res.error.message);

    await sb.from("audit_log").insert({
      entity_type: "product",
      entity_id: res.data.id,
      action: id ? "update" : "create",
      summary: `${s.nombre} ${id ? "actualizó" : "creó"} "${payload.name}" desde el portal`,
      changes: payload,
    });
    return { id: res.data.id as string };
  });
