import { z } from "zod";

const ESTADOS = ["proceso", "revision", "cerrada_cliente_credito", "cerrada_proveedor_cliente"] as const;
const CIERRES = ["cerrada_cliente_credito", "cerrada_proveedor_cliente"] as const;
const VIAS = ["Personalmente", "A domicilio", "WhatsApp", "Llamada", "Correo electrónico", "Otro"] as const;
const ROLES = ["colaborador", "admin", "gerente"] as const;

export const tokenSchema = z.object({ token: z.string().min(1) });
export const pin4 = z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos");

export const loginSchema = z.object({ colaborador_id: z.string().uuid(), pin: pin4 });

/** Ingreso al portal escribiendo la cédula (sin lista de nombres). */
export const loginCedulaSchema = z.object({
  cedula: z.string().trim().min(3).max(40),
  pin: pin4,
  recordar: z.boolean().default(false),
});

export const solicitudPinSchema = z.object({
  colaborador_id: z.string().uuid(),
  cedula: z.string().trim().min(3).max(40),
  nuevo_pin: pin4,
});

/** Solicitud de cambio de PIN escribiendo la cédula (portal de colaboradores). */
export const solicitudPinCedulaSchema = z.object({
  cedula: z.string().trim().min(3).max(40),
  nuevo_pin: pin4,
});

export const crearGarantiaSchema = z.object({
  token: z.string().min(1),
  pin: pin4,
  fecha: z.string().min(10).max(10),
  cliente: z.string().trim().min(2).max(200),
  cedula_cliente: z.string().trim().max(60).optional().or(z.literal("")),
  telefono_cliente: z.string().trim().max(60).optional().or(z.literal("")),
  direccion_cliente: z.string().trim().max(400).optional().or(z.literal("")),
  numero_factura: z.string().trim().max(80).optional().or(z.literal("")),
  fecha_facturacion: z.string().max(10).optional().or(z.literal("")),
  modelo_codigo: z.string().trim().max(200).optional().or(z.literal("")),
  descripcion_articulo: z.string().trim().max(500).optional().or(z.literal("")),
  dentro_15_dias: z.boolean().default(false),
  no_mal_uso: z.boolean().default(false),
  accion_realizada: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const seguimientoSchema = z.object({
  token: z.string().min(1),
  garantia_id: z.string().uuid(),
  fecha: z.string().min(10).max(10),
  via: z.enum(VIAS),
  texto: z.string().trim().min(1).max(4000),
});

export const evidenciaSchema = z.object({
  token: z.string().min(1),
  garantia_id: z.string().uuid(),
  filename: z.string().max(200),
  contentType: z.string().max(100),
  base64: z.string().min(10),
});

export const cierreSchema = z.object({
  token: z.string().min(1),
  garantia_id: z.string().uuid(),
  tipo_propuesto: z.enum(CIERRES),
  nota_final: z.string().trim().max(4000).optional().or(z.literal("")),
  numero_documento_subsanacion: z.string().trim().max(120).optional().or(z.literal("")),
});

export const idTokenSchema = z.object({ token: z.string().min(1), garantia_id: z.string().uuid() });

export const colaboradorSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(2).max(200),
  cedula: z.string().trim().max(40).optional().or(z.literal("")),
  rol: z.enum(ROLES).default("colaborador"),
  activo: z.boolean().default(true),
  pin: pin4.optional().or(z.literal("")),
});

export const resolverPinSchema = z.object({
  solicitud_id: z.string().uuid(),
  aprobar: z.boolean(),
});

export { ESTADOS, CIERRES, VIAS, ROLES };
