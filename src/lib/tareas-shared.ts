import { z } from "zod";

export const TIPOS_TAREA = ["tarea", "diaria", "incidencia", "recordatorio", "otro"] as const;
export type TipoTarea = (typeof TIPOS_TAREA)[number];

export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  tarea: "Tarea asignada",
  diaria: "Tarea diaria realizada",
  incidencia: "Incidencia",
  recordatorio: "Recordatorio",
  otro: "Otro registro",
};

export const TIPO_TAREA_PREFIJO: Record<TipoTarea, string> = {
  tarea: "TAR",
  diaria: "DIA",
  incidencia: "INC",
  recordatorio: "REC",
  otro: "OTR",
};

/* ------------------------------- Estados ------------------------------- */

export const ESTADOS_TAREA = ["pendiente", "aceptada", "en_proceso", "finalizada"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const ESTADO_TAREA_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  en_proceso: "En proceso",
  finalizada: "Finalizada",
};

/** Los registros históricos usan "completada"; se muestran como finalizados. */
export function normalizarEstado(estado: string): EstadoTarea {
  return estado === "completada" ? "finalizada" : (estado as EstadoTarea);
}

/* ------------------------------- Orígenes ------------------------------- */

export const ORIGENES_TAREA = [
  "linea-blanca",
  "bordados",
  "garantia",
  "cotizacion",
  "cotizacion-interna",
  "interaccion",
  "whatsapp",
  "interno",
] as const;
export type OrigenTarea = (typeof ORIGENES_TAREA)[number];

export const ORIGEN_TAREA_LABEL: Record<OrigenTarea, string> = {
  "linea-blanca": "Pedido Línea Blanca",
  bordados: "Bordados",
  garantia: "Garantía",
  cotizacion: "Cotización del carrito",
  "cotizacion-interna": "Cotización interna activa",
  interaccion: "Interacción del sitio",
  whatsapp: "Contacto por WhatsApp",
  interno: "Registro interno",
};

/* --------------------------- Vías de seguimiento --------------------------- */

export const VIAS_SEGUIMIENTO = [
  "Personalmente",
  "A domicilio",
  "WhatsApp",
  "Llamada",
  "Correo electrónico",
  "Otro",
] as const;
export type ViaSeguimiento = (typeof VIAS_SEGUIMIENTO)[number];

/* ------------------------------- Esquemas ------------------------------- */

export const seguimientoTareaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  fecha: z.string().min(10).max(10).optional(),
  via: z.enum(VIAS_SEGUIMIENTO),
  via_detalle: z.string().trim().max(120).optional().or(z.literal("")),
  texto: z.string().trim().min(1).max(4000),
});

export const listSeguimientosTareaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
});

export const crearTareaSchema = z.object({
  token: z.string().min(1),
  tipo: z.enum(TIPOS_TAREA),
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().max(4000).optional().or(z.literal("")),
  asignado_a: z.string().uuid().optional().or(z.literal("")),
  fecha: z.string().min(10).max(10).optional(),
  fecha_vencimiento: z.string().min(10).max(10).optional().or(z.literal("")),
});

export const listTareasSchema = z.object({
  token: z.string().min(1),
  tipo: z.enum(["todos", ...TIPOS_TAREA]).default("todos"),
  estado: z.enum(["todos", ...ESTADOS_TAREA]).default("todos"),
  desde: z.string().max(10).optional().or(z.literal("")),
  hasta: z.string().max(10).optional().or(z.literal("")),
  q: z.string().trim().max(120).optional(),
});

export const completarTareaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  nota_cierre: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const listoEntregaSchema = z.object({ token: z.string().min(1), id: z.string().uuid() });

export const RESULTADOS_COTIZACION = ["compra", "rechazo"] as const;
export type ResultadoCotizacion = (typeof RESULTADOS_COTIZACION)[number];

export const RESULTADO_COTIZACION_LABEL: Record<ResultadoCotizacion, string> = {
  compra: "Cerrada como compra",
  rechazo: "Cerrada como rechazo",
};

export const cerrarCotizacionInternaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  resultado: z.enum(RESULTADOS_COTIZACION),
  nota: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const crearCotizacionInternaSchema = z.object({
  token: z.string().min(1),
  cliente: z.string().trim().max(160).optional().or(z.literal("")),
  tipo_cliente: z.string().trim().max(40).optional().or(z.literal("")),
  resumen: z.string().trim().max(2000).optional().or(z.literal("")),
  total: z.union([z.string(), z.number()]).optional(),
});

export const reabrirTareaSchema = z.object({ token: z.string().min(1), id: z.string().uuid() });

export const aceptarTareaSchema = z.object({ token: z.string().min(1), id: z.string().uuid() });

export const asignarTareaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  colaborador_id: z.string().uuid(),
});

export const apoyoTareaSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  colaborador_id: z.string().uuid().nullable().optional(),
});

export const solicitudesActivasSchema = z.object({
  token: z.string().min(1),
  origen: z.enum(["todos", ...ORIGENES_TAREA]).default("todos"),
  estado: z.enum(["todos", ...ESTADOS_TAREA]).default("todos"),
  q: z.string().trim().max(120).optional(),
});

export const casosCerradosSchema = z.object({
  token: z.string().min(1),
  origen: z.enum(["todos", ...ORIGENES_TAREA]).default("todos"),
  desde: z.string().max(10).optional().or(z.literal("")),
  hasta: z.string().max(10).optional().or(z.literal("")),
  q: z.string().trim().max(120).optional(),
});

export const reporteRespuestaSchema = z.object({
  token: z.string().min(1),
  ambito: z.enum(["activas", "cerradas"]).default("cerradas"),
  desde: z.string().min(10).max(10),
  hasta: z.string().min(10).max(10),
  origen: z.enum(["todos", ...ORIGENES_TAREA]).default("todos"),
});

/** Días transcurridos entre dos fechas ISO (o hasta hoy si no hay cierre). */
export function diasEntre(desde: string | null | undefined, hasta?: string | null) {
  if (!desde) return null;
  const a = new Date(desde).getTime();
  const b = hasta ? new Date(hasta).getTime() : Date.now();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round(((b - a) / 86400000) * 10) / 10);
}
