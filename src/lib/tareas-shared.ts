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

export const ESTADOS_TAREA = ["pendiente", "completada"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const ESTADO_TAREA_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
};

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

export const reabrirTareaSchema = z.object({ token: z.string().min(1), id: z.string().uuid() });
