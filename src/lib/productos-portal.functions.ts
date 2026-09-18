import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin, verifySesion } from "./garantias.server";

const precioCotizacionProductoSchema = z.object({
  token: z.string().min(1),
  productos: z
    .array(
      z.object({
        catalogProductId: z.string().uuid().optional(),
        precioProveedor: z.union([z.string(), z.number()]).optional(),
        precioEtiqueta: z.union([z.string(), z.number()]).optional(),
        flete: z.union([z.string(), z.number()]).optional(),
        instalacion: z.union([z.string(), z.number()]).optional(),
      }),
    )
    .min(1)
    .max(30),
});

function numeroEditable(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

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
  quote_price_provider: z.number().nonnegative().nullable().optional(),
  quote_price_label: z.number().nonnegative().nullable().optional(),
  quote_freight: z.number().nonnegative().nullable().optional(),
  quote_installation: z.number().nonnegative().nullable().optional(),
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
          .select("id,name,brand,model,code,category_id,price_cash,disponibilidad,is_published,images,created_at,quote_price_provider,quote_price_label,quote_freight,quote_installation,quote_prices_updated_at")
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
      quote_price_provider: rest.quote_price_provider ?? null,
      quote_price_label: rest.quote_price_label ?? null,
      quote_freight: rest.quote_freight ?? null,
      quote_installation: rest.quote_installation ?? null,
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

/**
 * Buscador del catálogo para armar cotizaciones en la calculadora. Los
 * artículos de bordados solo se devuelven cuando la cotización es interna.
 */
export const buscarProductosCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(1),
        q: z.string().max(120).optional(),
        incluir_bordados: z.boolean().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb
      .from("products")
      .select("id,name,brand,model,code,description,images,price_cash,quote_price_provider,quote_price_label,quote_freight,quote_installation,categories(slug,name)")
      .eq("is_published", true)
      .order("name")
      .limit(60);
    const term = (data.q ?? "").trim();
    if (term) q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%,code.ilike.%${term}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const productos = (rows ?? [])
      .map((p: any) => ({
        id: p.id as string,
        name: p.name as string,
        brand: p.brand ?? null,
        model: p.model ?? null,
        code: p.code ?? null,
        description: p.description ? String(p.description).slice(0, 220) : null,
        images: p.images ?? [],
        price_cash: p.price_cash ?? null,
        quote_price_provider: p.quote_price_provider ?? null,
        quote_price_label: p.quote_price_label ?? null,
        quote_freight: p.quote_freight ?? null,
        quote_installation: p.quote_installation ?? null,
        categoria: p.categories?.name ?? null,
        es_bordado: p.categories?.slug === "bordados",
      }))
      .filter((p: any) => (data.incluir_bordados ? true : !p.es_bordado));

    return { productos };
  });

/** Guarda precios internos usados en cotización para reutilizarlos luego. */
export const guardarPreciosCotizacionProductos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => precioCotizacionProductoSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const idsActualizados: string[] = [];

    for (const producto of data.productos) {
      if (!producto.catalogProductId) continue;
      const payload = {
        quote_price_provider: numeroEditable(producto.precioProveedor),
        quote_price_label: numeroEditable(producto.precioEtiqueta),
        quote_freight: numeroEditable(producto.flete),
        quote_installation: numeroEditable(producto.instalacion),
        quote_prices_updated_at: new Date().toISOString(),
      };
      const tienePrecio = Object.values(payload).some((v, idx) => idx < 4 && v !== null);
      if (!tienePrecio) continue;
      const { error } = await sb.from("products").update(payload).eq("id", producto.catalogProductId);
      if (error) throw new Error(error.message);
      idsActualizados.push(producto.catalogProductId);
    }

    return { updated: idsActualizados.length };
  });
