import { createServerFn } from "@tanstack/react-start";
import { admin, verifySesion } from "./garantias.server";
import { crearTareaDeOrigen, hoyISO } from "./tareas.server";
import {
  crearSolicitudCotizacionSchema,
  finalizarSolicitudCotizacionSchema,
  solicitudCotizacionPortalSchema,
} from "./cotizaciones-carrito-shared";

const ETIQUETA_TIPO: Record<string, string> = {
  asociado: "Asociado",
  colaborador: "Colaborador GBD",
  tercero: "No asociado (tercero)",
  gobierno: "Instituciones Gubernamentales",
};

/**
 * El cliente envía su carrito desde el sitio público: se guarda la solicitud
 * con su número de cotización y se genera la tarea pendiente para que
 * cualquier colaborador la trabaje en la calculadora de precios.
 */
export const crearSolicitudCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearSolicitudCotizacionSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: numero, error: eNum } = await sb.rpc("next_numero_cotizacion", { _fecha: hoyISO() });
    if (eNum) throw new Error(eNum.message);

    // Se completa cada artículo con los datos de su ficha del catálogo:
    // imagen, modelo, nombre y una descripción corta.
    const ids = data.items.map((i) => i.product_id).filter((x): x is string => !!x);
    const fichas = new Map<string, any>();
    if (ids.length) {
      const { data: prods } = await sb
        .from("products")
        .select("id,name,brand,model,code,description,images")
        .in("id", ids);
      for (const p of prods ?? []) fichas.set(p.id as string, p);
    }
    const items = data.items.map((i) => {
      const f = i.product_id ? fichas.get(i.product_id) : null;
      const desc = (i.descripcion || f?.description || "").toString().trim().replace(/\s+/g, " ");
      return {
        ...i,
        nombre: f?.name || i.nombre,
        marca: f?.brand || i.marca || "",
        modelo: f?.model || i.modelo || "",
        codigo: f?.code || i.codigo || "",
        imagen: f?.images?.[0] || i.imagen || "",
        descripcion: desc.slice(0, 220),
      };
    });

    const resumen = items.map((i) => `${i.cantidad} × ${i.nombre}`).join(", ");


    const { data: row, error } = await sb
      .from("cotizacion_solicitudes")
      .insert({
        numero,
        tipo_cliente: data.tipo_cliente,
        cliente: data.cliente,
        items,
        notas: data.notas || null,
        estado: "pendiente",
      })
      .select("id,numero")
      .single();
    if (error) throw new Error(error.message);

    const numeroTarea = await crearTareaDeOrigen({
      origen: "cotizacion",
      titulo: `Cotizar carrito ${row.numero} · ${data.cliente.nombre}`,
      descripcion: `${ETIQUETA_TIPO[data.tipo_cliente]} · ${items.length} artículo(s): ${resumen}${
        data.notas ? ` · Nota: ${data.notas}` : ""
      }`,
    });

    const { data: tarea } = await sb
      .from("tareas")
      .select("id")
      .eq("numero_orden", numeroTarea)
      .maybeSingle();
    if (tarea?.id) await sb.from("cotizacion_solicitudes").update({ tarea_id: tarea.id }).eq("id", row.id);

    return { numero: row.numero as string };
  });

/** Carga la solicitud (datos del cliente + artículos) para trabajarla en el portal. */
export const obtenerSolicitudCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => solicitudCotizacionPortalSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb
      .from("cotizacion_solicitudes")
      .select("id,numero,tipo_cliente,cliente,items,notas,estado,tarea_id,resultado,created_at");
    if (data.id) q = q.eq("id", data.id);
    else if (data.tarea_id) q = q.eq("tarea_id", data.tarea_id);
    else if (data.numero) q = q.eq("numero", data.numero);
    else throw new Error("Falta la referencia de la cotización");
    const { data: row, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Solicitud de cotización no encontrada");
    return row;
  });

/**
 * El colaborador termina el detalle de precios: se guarda el resultado, se
 * genera el enlace de la cotización para el cliente y el caso se cierra
 * (pasa a la bitácora de casos cerrados).
 */
export const finalizarSolicitudCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => finalizarSolicitudCotizacionSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();

    const { data: sol, error: e0 } = await sb
      .from("cotizacion_solicitudes")
      .select("id,numero,tarea_id,estado")
      .eq("id", data.id)
      .maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!sol) throw new Error("Solicitud de cotización no encontrada");

    const { data: cot, error: eCot } = await sb
      .from("cotizaciones")
      .insert({
        tipo_cliente: data.tipo_cliente,
        modo: "ver",
        productos: data.productos,
        cliente: data.cliente,
        capacidad: data.capacidad ?? null,
      })
      .select("id")
      .single();
    if (eCot) throw new Error(eCot.message);

    const { error: eUp } = await sb
      .from("cotizacion_solicitudes")
      .update({
        estado: "cotizada",
        resultado: { productos: data.productos, capacidad: data.capacidad ?? null },
        cotizacion_id: cot.id,
        atendida_por: s.cid,
        tipo_cliente: data.tipo_cliente,
        cliente: data.cliente,
      })
      .eq("id", sol.id);
    if (eUp) throw new Error(eUp.message);

    const ahora = new Date().toISOString();
    if (sol.tarea_id) {
      const { data: t } = await sb.from("tareas").select("asignado_a,nota_cierre").eq("id", sol.tarea_id).maybeSingle();
      const nota = [
        t?.nota_cierre,
        `${s.nombre}: cotización ${sol.numero} completada.${data.nota_cierre ? ` ${data.nota_cierre}` : ""}`,
      ]
        .filter(Boolean)
        .join("\n");
      await sb
        .from("tareas")
        .update({
          asignado_a: t?.asignado_a ?? s.cid,
          estado: "finalizada",
          aceptada_en: ahora,
          finalizada_responsable_en: ahora,
          cerrada_en: ahora,
          completada_en: hoyISO(),
          completada_por: s.cid,
          nota_cierre: nota,
          documento_url: `/cotizacion/${cot.id}`,
        })
        .eq("id", sol.tarea_id);
    }

    return { numero: sol.numero as string, cotizacion_id: cot.id as string };
  });
