import { createServerFn } from "@tanstack/react-start";
import { admin, verifySesion } from "./garantias.server";
import {
  completarTareaSchema,
  crearTareaSchema,
  listTareasSchema,
  reabrirTareaSchema,
  TIPO_TAREA_PREFIJO,
  type TipoTarea,
} from "./tareas-shared";

const hoyISO = () => new Date().toISOString().slice(0, 10);

async function nombresColaboradores(sb: any) {
  const { data } = await sb.from("colaboradores").select("id,nombre");
  return new Map<string, string>((data ?? []).map((c: any) => [c.id, c.nombre]));
}

/** Genera el número de orden con trazabilidad para cualquier registro. */
export async function generarNumeroTarea(sb: any, tipo: TipoTarea) {
  const { data, error } = await sb.rpc("next_numero_tarea", {
    _fecha: hoyISO(),
    _prefijo: TIPO_TAREA_PREFIJO[tipo],
  });
  if (error) throw new Error(error.message);
  return data as string;
}

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

    const { data: row, error } = await sb
      .from("tareas")
      .insert({
        tipo: data.tipo,
        numero_orden: numero,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        asignado_a: asignado,
        creado_por: s.cid,
        fecha: data.fecha || hoyISO(),
        fecha_vencimiento: data.fecha_vencimiento || null,
        estado: completada ? "completada" : "pendiente",
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
    await verifySesion(data.token);
    const sb = await admin();
    let q: any = sb.from("tareas").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    if (data.tipo !== "todos") q = q.eq("tipo", data.tipo);
    if (data.estado !== "todos") q = q.eq("estado", data.estado);
    if (data.desde) q = q.gte("fecha", data.desde);
    if (data.hasta) q = q.lte("fecha", data.hasta);
    if (data.q) q = q.or(`titulo.ilike.%${data.q}%,descripcion.ilike.%${data.q}%,numero_orden.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const nombres = await nombresColaboradores(sb);
    return (rows ?? []).map((t: any) => ({
      ...t,
      responsable: nombres.get(t.asignado_a) ?? "Sin asignar",
      autor: nombres.get(t.creado_por) ?? "—",
      cerrada_por: t.completada_por ? nombres.get(t.completada_por) ?? "—" : null,
    }));
  });

/** Cualquier colaborador con sesión puede marcar un registro como culminado. */
export const cerrarTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => completarTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    const { error } = await sb
      .from("tareas")
      .update({
        estado: "completada",
        completada_en: hoyISO(),
        completada_por: s.cid,
        nota_cierre: data.nota_cierre || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reabrirTarea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reabrirTareaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const sb = await admin();
    const { error } = await sb
      .from("tareas")
      .update({ estado: "pendiente", completada_en: null, completada_por: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
