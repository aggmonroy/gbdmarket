import { admin, signPedidoToken } from "./garantias.server";
import { TIPO_TAREA_PREFIJO, type OrigenTarea, type TipoTarea } from "./tareas-shared";

export const hoyISO = () => new Date().toISOString().slice(0, 10);

export const ABIERTOS = ["pendiente", "aceptada", "en_proceso"];

/** Un colaborador solo ve sus tareas (o las libres). Admin y gerencia ven todo. */
export function aplicarVisibilidad(q: any, s: { cid: string; rol: string }) {
  if (s.rol === "admin" || s.rol === "gerente") return q;
  return q.or(`asignado_a.eq.${s.cid},apoyo_a.eq.${s.cid},asignado_a.is.null`);
}

export async function decorar(sb: any, rows: any[]) {
  const nombres = await nombresColaboradores(sb);
  return rows.map((t: any) => ({
    ...t,
    responsable: t.asignado_a ? nombres.get(t.asignado_a) ?? "—" : "Sin asignar",
    apoyo: t.apoyo_a ? nombres.get(t.apoyo_a) ?? "—" : null,
    autor: t.creado_por ? nombres.get(t.creado_por) ?? "—" : "Sistema",
    cerrada_por: t.completada_por ? nombres.get(t.completada_por) ?? "—" : null,
  }));
}

/** Adjunta el historial de seguimientos a cada tarea para verlo en la tarjeta. */
export async function agregarSeguimientos(sb: any, rows: any[]) {
  if (!rows.length) return rows;
  const { data } = await sb
    .from("tarea_seguimientos")
    .select("*")
    .in("tarea_id", rows.map((r: any) => r.id))
    .order("created_at", { ascending: true });
  const nombres = await nombresColaboradores(sb);
  const porTarea = new Map<string, any[]>();
  for (const s of data ?? []) {
    const lista = porTarea.get(s.tarea_id) ?? [];
    lista.push({ ...s, autor: s.creado_por ? nombres.get(s.creado_por) ?? "—" : "Sistema" });
    porTarea.set(s.tarea_id, lista);
  }
  return rows.map((r: any) => ({ ...r, seguimientos: porTarea.get(r.id) ?? [] }));
}

export async function nombresColaboradores(sb: any) {
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
 * Crea la tarea pendiente asociada a CUALQUIER solicitud recibida
 * (pedidos, bordados, cotizaciones, formularios de contacto, clics de
 * WhatsApp, garantías) para que el equipo le dé seguimiento con trazabilidad.
 */
export async function crearTareaDeOrigen(opts: {
  origen: OrigenTarea;
  titulo: string;
  descripcion?: string | null;
  bitacoraId?: string | null;
  garantiaId?: string | null;
  embroideryRequestId?: string | null;
  whatsappLeadId?: string | null;
  documentoUrl?: string | null;
}) {
  const sb = await admin();
  const numero = await generarNumeroTarea(sb, "tarea");
  const { error } = await sb.from("tareas").insert({
    tipo: "tarea",
    origen: opts.origen,
    numero_orden: numero,
    titulo: opts.titulo.slice(0, 200),
    descripcion: opts.descripcion || null,
    bitacora_id: opts.bitacoraId ?? null,
    garantia_id: opts.garantiaId ?? null,
    embroidery_request_id: opts.embroideryRequestId ?? null,
    whatsapp_lead_id: opts.whatsappLeadId ?? null,
    documento_url: opts.documentoUrl ?? null,
    fecha: hoyISO(),
    estado: "pendiente",
  });
  if (error) throw new Error(error.message);
  return numero;
}

/** Tarea de una pre-orden de Línea Blanca o Bordados. */
export async function crearTareaDeSolicitud(opts: {
  bitacoraId: string;
  numeroPedido: string;
  cliente: string;
  canal: string;
  resumen: string;
}) {
  return crearTareaDeOrigen({
    origen: opts.canal === "bordados" ? "bordados" : "linea-blanca",
    titulo: `Atender pedido ${opts.numeroPedido} · ${opts.cliente}`,
    descripcion: `${opts.canal === "bordados" ? "Pedido de bordados" : "Pedido de línea blanca"}: ${opts.resumen}`,
    bitacoraId: opts.bitacoraId,
    documentoUrl: `/pedido/${opts.numeroPedido}?t=${encodeURIComponent(await signPedidoToken(opts.numeroPedido))}`,
  });
}
