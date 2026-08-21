import { createServerFn } from "@tanstack/react-start";
import { admin, verifySesion } from "./garantias.server";
import { ABIERTOS, agregarSeguimientos, aplicarVisibilidad, decorar, generarNumeroTarea, hoyISO, nombresColaboradores } from "./tareas.server";
import {
  aceptarTareaSchema,
  apoyoTareaSchema,
  asignarTareaSchema,
  casosCerradosSchema,
  cerrarCotizacionInternaSchema,
  crearCotizacionInternaSchema,
  listoEntregaSchema,
  completarTareaSchema,
  crearTareaSchema,
  listSeguimientosTareaSchema,
  seguimientoTareaSchema,
  listTareasSchema,
  reabrirTareaSchema,
  reporteRespuestaSchema,
  solicitudesActivasSchema,
} from "./tareas-shared";

/**
 * Crea una tarea, tarea diaria, incidencia, recordatorio u otro registro.
 * Solo admin y gerente pueden asignar el registro a otro colaborador.
 */
export const crearTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();

    const puedeAsignar = s.rol === "admin" || s.rol === "gerente";
    const asignado = data.asignado_a
      ? puedeAsignar || data.asignado_a === s.cid
        ? data.asignado_a
        : (() => {
            throw new Error("Solo la administración o la gerencia pueden asignar tareas a otro colaborador");
          })()
      : s.cid;

    if (s.rol === "gerente" && data.tipo !== "tarea" && data.tipo !== "recordatorio")
      throw new Error("La gerencia solo puede crear tareas y recordatorios para el personal");

    const numero = await generarNumeroTarea(sb, data.tipo);
    const completada = data.tipo === "diaria";
    const ahora = new Date().toISOString();

    const { data: row, error } = await sb
      .from("tareas")
      .insert({
        tipo: data.tipo,
        origen: "interno",
        numero_orden: numero,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        asignado_a: asignado,
        creado_por: s.cid,
        fecha: data.fecha || hoyISO(),
        fecha_vencimiento: data.fecha_vencimiento || null,
        estado: completada ? "finalizada" : "aceptada",
        aceptada_en: ahora,
        finalizada_responsable_en: completada ? ahora : null,
        cerrada_en: completada ? ahora : null,
        completada_en: completada ? hoyISO() : null,
        completada_por: completada ? s.cid : null,
      })
      .select("id,numero_orden")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string; numero_orden: string };
  });

/** Bitácora de tareas: filtrable por naturaleza, estado y rango de fechas. */
export const listTareas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listTareasSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb
      .from("tareas")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    q = aplicarVisibilidad(q, s);
    if (data.tipo !== "todos") q = q.eq("tipo", data.tipo);
    if (data.estado === "finalizada") q = q.in("estado", ["finalizada", "completada"]);
    else if (data.estado !== "todos") q = q.eq("estado", data.estado);
    if (data.desde) q = q.gte("fecha", data.desde);
    if (data.hasta) q = q.lte("fecha", data.hasta);
    if (data.q) q = q.or(`titulo.ilike.%${data.q}%,descripcion.ilike.%${data.q}%,numero_orden.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return decorar(sb, rows ?? []);
  });

/* --------------------------- Ciclo de la tarea --------------------------- */

/** Cualquier colaborador puede aceptar una tarea y quedar como responsable. */
export const aceptarTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => aceptarTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t, error: e0 } = await sb.from("tareas").select("asignado_a,estado").eq("id", data.id).maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!t) throw new Error("Tarea no encontrada");
    if (t.asignado_a && t.asignado_a !== s.cid)
      throw new Error("Esta tarea ya tiene un responsable asignado");
    const { error } = await sb
      .from("tareas")
      .update({ asignado_a: s.cid, estado: "aceptada", aceptada_en: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El admin asigna o reasigna el responsable de cualquier tarea. */
export const asignarTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => asignarTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol !== "admin") throw new Error("Solo la administración puede asignar tareas");
    const sb = await admin();
    const { error } = await sb
      .from("tareas")
      .update({
        asignado_a: data.colaborador_id,
        estado: "aceptada",
        aceptada_en: new Date().toISOString(),
        finalizada_responsable_en: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marca la tarea en proceso y agrega (o quita) un colaborador de apoyo. */
export const agregarApoyo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => apoyoTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t } = await sb.from("tareas").select("asignado_a").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("Tarea no encontrada");
    if (data.colaborador_id && data.colaborador_id === t.asignado_a)
      throw new Error("El apoyo debe ser un colaborador distinto al responsable");
    const { error } = await sb
      .from("tareas")
      .update({
        apoyo_a: data.colaborador_id ?? null,
        estado: "en_proceso",
        finalizada_apoyo_en: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Finaliza la tarea por parte de quien la marca. Si hay un colaborador de
 * apoyo, el caso solo se cierra cuando AMBOS la finalizan.
 */
export const finalizarTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => completarTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t, error: e0 } = await sb
      .from("tareas")
      .select("asignado_a,apoyo_a,finalizada_responsable_en,finalizada_apoyo_en,nota_cierre")
      .eq("id", data.id)
      .maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!t) throw new Error("Tarea no encontrada");

    const ahora = new Date().toISOString();
    const esResponsable = !t.asignado_a || t.asignado_a === s.cid || s.rol === "admin";
    const esApoyo = t.apoyo_a === s.cid;
    if (!esResponsable && !esApoyo) throw new Error("Esta tarea no está a tu cargo");

    const patch: Record<string, any> = {};
    if (esApoyo) patch.finalizada_apoyo_en = ahora;
    if (esResponsable) patch.finalizada_responsable_en = ahora;
    if (data.nota_cierre) patch.nota_cierre = [t.nota_cierre, `${s.nombre}: ${data.nota_cierre}`].filter(Boolean).join("\n");

    const respOk = patch.finalizada_responsable_en ?? t.finalizada_responsable_en;
    const apoyoOk = patch.finalizada_apoyo_en ?? t.finalizada_apoyo_en;
    const cerrada = Boolean(respOk) && (!t.apoyo_a || Boolean(apoyoOk));

    if (cerrada) {
      patch.estado = "finalizada";
      patch.cerrada_en = ahora;
      patch.completada_en = hoyISO();
      patch.completada_por = s.cid;
    } else {
      patch.estado = "en_proceso";
    }

    const { error } = await sb.from("tareas").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, cerrada };
  });

export const reabrirTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reabrirTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { error } = await sb
      .from("tareas")
      .update({
        estado: "aceptada",
        completada_en: null,
        completada_por: null,
        cerrada_en: null,
        finalizada_responsable_en: null,
        finalizada_apoyo_en: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Marca un pedido de bordados como listo para entrega: queda visible en la
 * tarjeta y se registra en el historial de seguimientos.
 */
export const marcarListoEntrega = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listoEntregaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t } = await sb.from("tareas").select("id,estado,listo_entrega_en").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("Tarea no encontrada");
    if (t.listo_entrega_en) return { ok: true, ya: true };
    const ahora = new Date().toISOString();
    const { error } = await sb
      .from("tareas")
      .update({
        listo_entrega_en: ahora,
        estado: t.estado === "pendiente" ? "en_proceso" : t.estado === "aceptada" ? "en_proceso" : t.estado,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("tarea_seguimientos").insert({
      tarea_id: data.id,
      fecha: hoyISO(),
      via: "Personalmente",
      texto: "El pedido de bordados quedó listo para entrega.",
      creado_por: s.cid,
    });
    return { ok: true };
  });

/**
 * Actualiza el estado del flujo de bordados: en proceso, retraso por proveedor,
 * listo para entrega o finalizado. "En proceso" exige fecha de entrega.
 */
export const actualizarEstadoBordado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => estadoBordadoSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t } = await sb
      .from("tareas")
      .select("id,estado,fecha_vencimiento")
      .eq("id", data.id)
      .maybeSingle();
    if (!t) throw new Error("Tarea no encontrada");

    const e = data.estado_bordado;
    if (e === "en_proceso" && !data.fecha_entrega && !t.fecha_vencimiento)
      throw new Error("Indica la fecha de entrega para poner el pedido en proceso");

    const ahora = new Date().toISOString();
    const patch: Record<string, unknown> = {
      estado_bordado: e,
      listo_entrega_en: e === "listo_entrega" ? ahora : null,
      estado: e === "finalizado" ? "finalizada" : "en_proceso",
    };
    if (data.fecha_entrega) patch.fecha_vencimiento = data.fecha_entrega;
    if (e === "finalizado") {
      patch.cerrada_en = ahora;
      patch.finalizada_responsable_en = ahora;
      patch.nota_cierre = data.nota || "Pedido de bordados entregado.";
    } else {
      patch.cerrada_en = null;
      patch.finalizada_responsable_en = null;
    }

    const { error } = await sb.from("tareas").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    await sb.from("tarea_seguimientos").insert({
      tarea_id: data.id,
      fecha: hoyISO(),
      via: "Personalmente",
      texto: [
        `Estado del pedido de bordados: ${ESTADO_BORDADO_LABEL[e]}.`,
        data.fecha_entrega ? `Fecha de entrega: ${data.fecha_entrega}.` : null,
        data.nota || null,
      ]
        .filter(Boolean)
        .join(" "),
      creado_por: s.cid,
    });

    return { ok: true };
  });



/** Guarda una cotización hecha en la calculadora como cotización activa. */
export const crearCotizacionInterna = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearCotizacionInternaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const numero = await generarNumeroTarea(sb, "tarea");
    const ahora = new Date().toISOString();
    const cliente = data.cliente?.trim() || "Cliente sin nombre";
    const { data: row, error } = await sb
      .from("tareas")
      .insert({
        tipo: "tarea",
        origen: "cotizacion-interna",
        numero_orden: numero,
        titulo: `Cotización activa · ${cliente}`,
        descripcion: [
          data.tipo_cliente ? `Tipo de cliente: ${data.tipo_cliente}` : null,
          data.total ? `Total cotizado: B/. ${data.total}` : null,
          data.resumen || null,
        ]
          .filter(Boolean)
          .join("\n"),
        asignado_a: s.cid,
        creado_por: s.cid,
        fecha: hoyISO(),
        estado: "aceptada",
        aceptada_en: ahora,
      })
      .select("id,numero_orden")
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string; numero_orden: string };
  });

/** Cierra una cotización activa marcándola como compra o como rechazo. */
export const cerrarCotizacionInterna = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cerrarCotizacionInternaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t } = await sb.from("tareas").select("id,nota_cierre").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("Cotización no encontrada");
    const ahora = new Date().toISOString();
    const etiqueta = data.resultado === "compra" ? "Cerrada como COMPRA" : "Cerrada como RECHAZO";
    const { error } = await sb
      .from("tareas")
      .update({
        resultado_cierre: data.resultado,
        estado: "finalizada",
        finalizada_responsable_en: ahora,
        finalizada_apoyo_en: ahora,
        cerrada_en: ahora,
        completada_en: hoyISO(),
        completada_por: s.cid,
        nota_cierre: [t.nota_cierre, `${s.nombre}: ${etiqueta}${data.nota ? ` · ${data.nota}` : ""}`]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- Seguimientos --------------------------- */

/**
 * Registra una acción de seguimiento sobre la tarea (pedidos de Línea Blanca,
 * bordados, garantías o registros internos) indicando la vía de contacto.
 */
export const registrarSeguimientoTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => seguimientoTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { data: t } = await sb.from("tareas").select("id,estado").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("Tarea no encontrada");
    const { error } = await sb.from("tarea_seguimientos").insert({
      tarea_id: data.id,
      fecha: data.fecha || hoyISO(),
      via: data.via,
      via_detalle: data.via === "Otro" ? data.via_detalle || null : null,
      texto: data.texto,
      creado_por: s.cid,
    });
    if (error) throw new Error(error.message);
    if (t.estado === "pendiente")
      await sb
        .from("tareas")
        .update({ estado: "aceptada", asignado_a: s.cid, aceptada_en: new Date().toISOString() })
        .eq("id", data.id);
    return { ok: true };
  });

export const listSeguimientosTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listSeguimientosTareaSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("tarea_seguimientos")
      .select("*")
      .eq("tarea_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const nombres = await nombresColaboradores(sb);
    return (rows ?? []).map((r: any) => ({ ...r, autor: r.creado_por ? nombres.get(r.creado_por) ?? "—" : "Sistema" }));
  });

/* ----------------------- Solicitudes activas / cerradas ----------------------- */

export const solicitudesActivas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => solicitudesActivasSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb.from("tareas").select("*").in("estado", ABIERTOS).order("created_at", { ascending: true }).limit(500);
    q = aplicarVisibilidad(q, s);
    if (data.origen !== "todos") q = q.eq("origen", data.origen);
    if (data.estado !== "todos") q = q.eq("estado", data.estado);
    if (data.q) q = q.or(`titulo.ilike.%${data.q}%,descripcion.ilike.%${data.q}%,numero_orden.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const items = await agregarSeguimientos(sb, await decorar(sb, rows ?? []));
    const porOrigen: Record<string, number> = {};
    const porEstado: Record<string, number> = {};
    for (const t of items) {
      porOrigen[t.origen ?? "interno"] = (porOrigen[t.origen ?? "interno"] ?? 0) + 1;
      porEstado[t.estado] = (porEstado[t.estado] ?? 0) + 1;
    }
    return { items, total: items.length, porOrigen, porEstado };
  });

export const casosCerrados = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => casosCerradosSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb
      .from("tareas")
      .select("*")
      .in("estado", ["finalizada", "completada"])
      .order("cerrada_en", { ascending: false, nullsFirst: false })
      .limit(500);
    q = aplicarVisibilidad(q, s);
    if (data.origen !== "todos") q = q.eq("origen", data.origen);
    if (data.desde) q = q.gte("fecha", data.desde);
    if (data.hasta) q = q.lte("fecha", data.hasta);
    if (data.q) q = q.or(`titulo.ilike.%${data.q}%,descripcion.ilike.%${data.q}%,numero_orden.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return decorar(sb, rows ?? []);
  });

/** Reporte de capacidad de respuesta por rango de fechas. */
export const reporteRespuesta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reporteRespuestaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb.from("tareas").select("*").gte("fecha", data.desde).lte("fecha", data.hasta);
    q = aplicarVisibilidad(q, s);
    q = data.ambito === "cerradas" ? q.in("estado", ["finalizada", "completada"]) : q.in("estado", ABIERTOS);
    if (data.origen !== "todos") q = q.eq("origen", data.origen);
    const { data: rows, error } = await q.order("fecha", { ascending: true });
    if (error) throw new Error(error.message);
    const items = await decorar(sb, rows ?? []);

    const horas = (a?: string | null, b?: string | null) =>
      a && b ? Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3600000) : null;

    const filas = items.map((t: any) => ({
      ...t,
      horas_para_aceptar: horas(t.created_at, t.aceptada_en),
      horas_para_cerrar: horas(t.created_at, t.cerrada_en ?? new Date().toISOString()),
    }));
    const prom = (vals: Array<number | null>) => {
      const v = vals.filter((x): x is number => typeof x === "number");
      return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
    };
    return {
      desde: data.desde,
      hasta: data.hasta,
      ambito: data.ambito,
      total: filas.length,
      promedio_aceptacion_horas: prom(filas.map((f: any) => f.horas_para_aceptar)),
      promedio_cierre_horas: prom(filas.map((f: any) => f.horas_para_cerrar)),
      items: filas,
    };
  });
