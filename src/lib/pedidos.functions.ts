import { createServerFn } from "@tanstack/react-start";
import { admin, requireEscritura, signReporteToken, verifySesion } from "./garantias.server";
import { crearTareaDeSolicitud } from "./tareas.server";
import {
  agendaSchema,
  bandejaSchema,
  crearPreordenSchema,
  listPedidosSchema,
  numeroPedidoSchema,
  resumenItems,
  tokenIdSchema,
  updatePedidoSchema,
} from "./pedidos-shared";

/** Público: crea la pre-orden con número correlativo y la deja en la bitácora. */
export const crearPreorden = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearPreordenSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const hoy = new Date().toISOString().slice(0, 10);
    const { data: numero, error: numError } = await sb.rpc("next_numero_pedido", { _fecha: hoy });
    if (numError) throw new Error(numError.message);
    const resumen = resumenItems(data.items);
    const { data: row, error } = await sb
      .from("bitacora")
      .insert({
        numero_pedido: numero,
        cliente_nombre: data.cliente_nombre,
        cliente_telefono: data.cliente_telefono || null,
        cliente_email: data.cliente_email || null,
        producto_servicio: resumen,
        categoria: data.categoria || null,
        origen: data.origen,
        estado: "pre_orden",
        observaciones: data.observaciones || null,
        meta: { ...(data.meta ?? {}), canal: data.canal, items: data.items },
        consent_accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await crearTareaDeSolicitud({
      bitacoraId: (row as any).id,
      numeroPedido: numero as string,
      cliente: data.cliente_nombre,
      canal: data.canal,
      resumen,
    });
    return { numero_pedido: numero as string };
  });


/** Público: documento de una sola vista. El número de pedido actúa como clave. */
export const getPedido = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => numeroPedidoSchema.parse(d))
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

export const listPedidos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listPedidosSchema.parse(d))
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

export const actualizarPedido = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updatePedidoSchema.parse(d))
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
  .inputValidator((d: unknown) => tokenIdSchema.parse(d))
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
    agendaSchema.parse(d),
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
  .inputValidator((d: unknown) => tokenIdSchema.parse(d))
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


/**
 * Bandeja consolidada de seguimiento: pedidos de Línea Blanca, pedidos de
 * Bordados y garantías abiertas en una sola lista, con enlace imprimible.
 */
export const bandejaSeguimiento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bandejaSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const items: any[] = [];
    const term = (data.q ?? "").toLowerCase();

    if (data.tipo !== "garantia") {
      const { data: pedidos, error } = await sb
        .from("bitacora")
        .select("*")
        .not("numero_pedido", "is", null)
        .neq("estado", "cerrado")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw new Error(error.message);
      for (const p of pedidos ?? []) {
        const canal = ((p.meta as any)?.canal ?? p.categoria ?? "linea-blanca") === "bordados" ? "bordados" : "linea-blanca";
        if (data.tipo !== "todos" && data.tipo !== canal) continue;
        items.push({
          key: `p-${p.id}`,
          tipo: canal,
          id: p.id,
          referencia: p.numero_pedido,
          cliente: p.cliente_nombre,
          resumen: p.producto_servicio,
          estado: p.estado,
          fecha: p.created_at,
          descripcion: p.descripcion,
          documento: `/pedido/${p.numero_pedido}`,
        });
      }
    }

    if (data.tipo === "todos" || data.tipo === "garantia") {
      const { data: garantias, error } = await sb
        .from("garantias")
        .select("id,numero_garantia,cliente,descripcion_articulo,estado,fecha")
        .in("estado", ["proceso", "revision"])
        .order("fecha", { ascending: false });
      if (error) throw new Error(error.message);
      for (const g of garantias ?? []) {
        items.push({
          key: `g-${g.id}`,
          tipo: "garantia",
          id: g.id,
          referencia: g.numero_garantia,
          cliente: g.cliente,
          resumen: g.descripcion_articulo,
          estado: g.estado,
          fecha: g.fecha,
          descripcion: null,
          documento: `/reporte-garantia/${g.id}?t=${encodeURIComponent(await signReporteToken(g.id))}`,
        });
      }
    }

    const filtrados = term
      ? items.filter((i) =>
          [i.referencia, i.cliente, i.resumen].some((v: any) => (v ?? "").toLowerCase().includes(term)),
        )
      : items;
    return filtrados.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  });
