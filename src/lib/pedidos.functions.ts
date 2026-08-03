import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin, requireEscritura, verifySesion } from "./garantias.server";

export const ESTADOS_PEDIDO = ["pre_orden", "en_proceso", "notificado", "cerrado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pre_orden: "Pre-orden",
  en_proceso: "En proceso",
  notificado: "Notificado",
  cerrado: "Cerrado",
};

const itemSchema = z.object({
  descripcion: z.string().trim().min(1).max(300),
  cantidad: z.number().int().min(1).max(999).default(1),
  detalle: z.string().trim().max(400).optional().or(z.literal("")),
});

const crearSchema = z.object({
  cliente_nombre: z.string().trim().min(2).max(200),
  cliente_telefono: z.string().trim().max(60).optional().or(z.literal("")),
  cliente_email: z.string().trim().max(200).optional().or(z.literal("")),
  origen: z.enum(["catalogo", "financiamiento", "garantia", "contacto", "bordados", "whatsapp"]),
  canal: z.enum(["linea-blanca", "bordados"]).default("linea-blanca"),
  categoria: z.string().trim().max(120).optional().or(z.literal("")),
  observaciones: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(30),
  meta: z.record(z.string(), z.any()).optional(),
  consent: z.literal(true),
});

export type PreordenItem = z.infer<typeof itemSchema>;

function resumenItems(items: PreordenItem[]) {
  return items.map((i) => `${i.cantidad} x ${i.descripcion}`).join(" · ").slice(0, 400);
}

/** Público: crea la pre-orden con número correlativo y la deja en la bitácora. */
export const crearPreorden = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const hoy = new Date().toISOString().slice(0, 10);
    const { data: numero, error: numError } = await sb.rpc("next_numero_pedido", { _fecha: hoy });
    if (numError) throw new Error(numError.message);
    const { error } = await sb.from("bitacora").insert({
      numero_pedido: numero,
      cliente_nombre: data.cliente_nombre,
      cliente_telefono: data.cliente_telefono || null,
      cliente_email: data.cliente_email || null,
      producto_servicio: resumenItems(data.items),
      categoria: data.categoria || null,
      origen: data.origen,
      estado: "pre_orden",
      observaciones: data.observaciones || null,
      meta: { ...(data.meta ?? {}), canal: data.canal, items: data.items },
      consent_accepted_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { numero_pedido: numero as string };
  });

/** Público: documento de una sola vista. El número de pedido actúa como clave. */
export const getPedido = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ numero: z.string().trim().min(6).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("bitacora")
      .select(
        "numero_pedido,created_at,cliente_nombre,cliente_telefono,cliente_email,producto_servicio,categoria,origen,estado,observaciones,meta,fecha_entrega",
      )
      .eq("numero_pedido", data.numero)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No encontramos este pedido");
    return row as any;
  });

/* --------------------- Portal de colaboradores (sesión por PIN) --------------------- */

const listSchema = z.object({
  token: z.string().min(1),
  estado: z.enum(ESTADOS_PEDIDO).optional(),
  q: z.string().trim().max(120).optional(),
});

export const listPedidos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb
      .from("bitacora")
      .select("*")
      .not("numero_pedido", "is", null)
      .order("created_at", { ascending: false })
      .limit(400);
    if (data.estado) q = q.eq("estado", data.estado);
    if (data.q)
      q = q.or(
        `numero_pedido.ilike.%${data.q}%,cliente_nombre.ilike.%${data.q}%,producto_servicio.ilike.%${data.q}%`,
      );
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const updateSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_PEDIDO).optional(),
  descripcion: z.string().trim().max(4000).optional(),
  fecha_entrega: z.string().max(10).nullable().optional(),
});

export const actualizarPedido = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireEscritura(data.token);
    const sb = await admin();
    const patch: Record<string, any> = {};
    if (data.estado) patch.estado = data.estado;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion || null;
    if (data.fecha_entrega !== undefined) patch.fecha_entrega = data.fecha_entrega || null;
    const { error } = await sb.from("bitacora").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.estado || data.descripcion) {
      await sb.from("bitacora_historial").insert({
        bitacora_id: data.id,
        estado_nuevo: data.estado ?? "pre_orden",
        nota: `${s.nombre}: ${data.descripcion || "Actualización de estado"}`,
      });
    }
    return { ok: true };
  });

export const historialPedido = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(1), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const { data: rows } = await sb
      .from("bitacora_historial")
      .select("*")
      .eq("bitacora_id", data.id)
      .order("created_at", { ascending: false });
    return rows ?? [];
  });

/**
 * Agenda del día: todas las tareas pendientes de TODOS los colaboradores,
 * más las entregas de pedidos programadas para esa fecha.
 */
export const agendaDelDia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(1), fecha: z.string().min(10).max(10) }).parse(d),
  )
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const [{ data: tareas }, { data: colabs }, { data: pedidos }, { data: garantias }] = await Promise.all([
      sb.from("tareas").select("*").eq("estado", "pendiente").order("created_at", { ascending: true }),
      sb.from("colaboradores").select("id,nombre"),
      sb
        .from("bitacora")
        .select("id,numero_pedido,cliente_nombre,producto_servicio,estado,fecha_entrega")
        .eq("fecha_entrega", data.fecha)
        .not("numero_pedido", "is", null),
      sb.from("garantias").select("id,numero_garantia,cliente,estado,fecha").in("estado", ["proceso", "revision"]),
    ]);
    const nombre = new Map<string, string>((colabs ?? []).map((c: any) => [c.id, c.nombre]));
    return {
      tareas: (tareas ?? []).map((t: any) => ({
        ...t,
        responsable: nombre.get(t.asignado_a) ?? "Sin asignar",
      })),
      entregas: pedidos ?? [],
      garantias: garantias ?? [],
    };
  });

export const completarTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(1), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireEscritura(data.token);
    const sb = await admin();
    const { error } = await sb
      .from("tareas")
      .update({ estado: "completada", completada_en: new Date().toISOString().slice(0, 10) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
