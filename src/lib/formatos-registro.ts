/**
 * Reglas del registro diario de documentos emitidos desde Formatos.
 * Se comparten entre el portal y el servidor.
 */
import { z } from "zod";

export const ESTADOS_DOCUMENTO = ["vigente", "anulado", "eliminado"] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export const ESTADO_DOCUMENTO_LABEL: Record<EstadoDocumento, string> = {
  vigente: "Vigente",
  anulado: "Anulado",
  eliminado: "Eliminado",
};

export const ACCIONES_DOCUMENTO = ["anular", "eliminar"] as const;
export type AccionDocumento = (typeof ACCIONES_DOCUMENTO)[number];

export const ACCION_DOCUMENTO_LABEL: Record<AccionDocumento, string> = {
  anular: "Anulación",
  eliminar: "Eliminación",
};

/** Fecha de hoy en Panamá: el registro es diario según la hora local de la cooperativa. */
export const hoyPanama = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama" }).format(d);

/** Solo el administrador anula o elimina directamente y aprueba lo que piden los demás. */
export const puedeResolverDocumentos = (rol: string) => rol === "admin";

/** La gerencia es de solo lectura: no pide anulaciones. */
export const puedeSolicitarAnulacion = (rol: string) => rol !== "gerente";

/** Admin y gerencia consultan todo el registro; cada colaborador, lo que emitió. */
export const veTodoElRegistro = (rol: string) => rol === "admin" || rol === "gerente";

/** Estado tras aprobar una solicitud (o al hacerlo el admin directamente). */
export const estadoTrasAccion = (accion: AccionDocumento): EstadoDocumento =>
  accion === "anular" ? "anulado" : "eliminado";

/** Documento ya emitido que está abierto en el editor. */
export type DocumentoAbierto = {
  id: string;
  numero: string;
  estado: EstadoDocumento;
  /** "nuevo": se emitió en esta sesión de trabajo; "reabierto": se abrió desde el registro. */
  modo: "nuevo" | "reabierto";
  /** Contenido tal como se guardó, para distinguir una reimpresión de un documento nuevo. */
  original: string;
};

export type DecisionEmision = "crear" | "actualizar" | "reimprimir" | "ninguna";

/**
 * Qué hacer al imprimir o descargar:
 * - sin documento: se registra uno nuevo;
 * - anulado o eliminado: no se vuelve a registrar (se imprime con la marca);
 * - sin cambios desde que se emitió o se abrió: es una reimpresión (mismo número);
 * - con cambios: es un documento nuevo con su propio número, para no
 *   sobrescribir el anterior (p. ej. dos órdenes de combustible el mismo día).
 */
export function decidirEmision(doc: DocumentoAbierto | null, contenido: string): DecisionEmision {
  if (!doc) return "crear";
  if (doc.estado !== "vigente") return "ninguna";
  return doc.original === contenido ? "reimprimir" : "crear";
}

/** Límite del contenido guardado (incluye fotos anexas comprimidas). */
export const MAX_CONTENIDO_DOCUMENTO = 8_000_000;

const token = z.string().min(1);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const registrarEmisionSchema = z.object({
  token,
  accion: z.enum(["crear", "actualizar", "reimprimir"]),
  id: z.string().uuid().optional(),
  formato: z.string().trim().min(1).max(60),
  clave: z.string().trim().min(1).max(120),
  titulo: z.string().trim().min(1).max(160),
  datos: z.unknown(),
});

export const listarRegistroSchema = z.object({
  token,
  desde: fecha,
  hasta: fecha,
  q: z.string().trim().max(120).optional(),
  incluirEliminados: z.boolean().optional(),
});

export const documentoIdSchema = z.object({ token, id: z.string().uuid() });

export const accionDocumentoSchema = z.object({
  token,
  id: z.string().uuid(),
  accion: z.enum(ACCIONES_DOCUMENTO),
  motivo: z.string().trim().min(3, "Escribe el motivo").max(500),
});

export const resolverSolicitudDocumentoSchema = z.object({
  token,
  solicitud_id: z.string().uuid(),
  aprobar: z.boolean(),
  nota: z.string().trim().max(500).optional().or(z.literal("")),
});
