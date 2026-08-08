import { z } from "zod";

export const TIPOS_CLIENTE_COTIZACION = ["asociado", "colaborador", "tercero"] as const;

export const clienteCotizacionSchema = z.object({
  nombre: z.string().trim().min(3).max(120),
  cedula: z.string().trim().min(4).max(40),
  telefono: z.string().trim().min(6).max(30),
  correo: z.string().trim().email().max(160),
  direccion: z.string().trim().min(4).max(300),
});

export const itemCarritoSchema = z.object({
  product_id: z.string().uuid().optional().or(z.literal("")),
  nombre: z.string().trim().min(1).max(200),
  marca: z.string().trim().max(120).optional().or(z.literal("")),
  modelo: z.string().trim().max(120).optional().or(z.literal("")),
  codigo: z.string().trim().max(120).optional().or(z.literal("")),
  imagen: z.string().trim().max(600).optional().or(z.literal("")),
  cantidad: z.number().int().min(1).max(99),
});

export const crearSolicitudCotizacionSchema = z.object({
  tipo_cliente: z.enum(TIPOS_CLIENTE_COTIZACION),
  cliente: clienteCotizacionSchema,
  items: z.array(itemCarritoSchema).min(1).max(30),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true),
});

export const solicitudCotizacionPortalSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid().optional(),
  numero: z.string().trim().max(40).optional(),
  tarea_id: z.string().uuid().optional(),
});

export const finalizarSolicitudCotizacionSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  tipo_cliente: z.enum(TIPOS_CLIENTE_COTIZACION),
  cliente: z.object({
    nombre: z.string().trim().max(120),
    cedula: z.string().trim().max(40),
    telefono: z.string().trim().max(30),
    correo: z.string().trim().max(160),
    direccion: z.string().trim().max(300),
  }),
  productos: z
    .array(
      z.object({
        nombre: z.string().trim().max(200),
        precioProveedor: z.union([z.string(), z.number()]).optional(),
        precioEtiqueta: z.union([z.string(), z.number()]).optional(),
        flete: z.union([z.string(), z.number()]).optional(),
        instalacion: z.union([z.string(), z.number()]).optional(),
        descAsociadoPct: z.number().optional(),
        descTerceroPct: z.number().optional(),
        descripcion: z.string().max(1000).optional(),
        imagen: z.string().max(600).optional(),
      })
    )
    .min(1)
    .max(30),
  capacidad: z.any().optional(),
  nota_cierre: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClienteCotizacion = z.infer<typeof clienteCotizacionSchema>;
