import { z } from "zod";

export const ESTADOS_PEDIDO = ["pre_orden", "en_proceso", "notificado", "cerrado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pre_orden: "Pre-orden",
  en_proceso: "En proceso",
  notificado: "Notificado",
  cerrado: "Cerrado",
};

export const itemSchema = z.object({
  descripcion: z.string().trim().min(1).max(300),
  cantidad: z.number().int().min(1).max(999).default(1),
  detalle: z.string().trim().max(400).optional().or(z.literal("")),
});

export type PreordenItem = z.infer<typeof itemSchema>;

export const crearPreordenSchema = z.object({
  cliente_nombre: z.string().trim().min(2).max(200),
  cliente_telefono: z.string().trim().max(60).optional().or(z.literal("")),
  cliente_email: z.string().trim().max(200).optional().or(z.literal("")),
  origen: z.enum(["catalogo", "financiamiento", "garantia", "contacto", "bordados", "whatsapp"]),
  canal: z.enum(["linea-blanca", "bordados"]).default("linea-blanca"),
  categoria: z.string().trim().max(120).optional().or(z.literal("")),
  observaciones: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(30),
  meta: z.record(z.string(), z.any()).optional(),
  consent: z.literal(true),
});

export const listPedidosSchema = z.object({
  token: z.string().min(1),
  estado: z.enum(ESTADOS_PEDIDO).optional(),
  q: z.string().trim().max(120).optional(),
});

export const updatePedidoSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_PEDIDO).optional(),
  descripcion: z.string().trim().max(4000).optional(),
  fecha_entrega: z.string().max(10).nullable().optional(),
});

export const tokenIdSchema = z.object({ token: z.string().min(1), id: z.string().uuid() });
export const numeroPedidoSchema = z.object({ numero: z.string().trim().min(6).max(40) });
export const agendaSchema = z.object({ token: z.string().min(1), fecha: z.string().min(10).max(10) });

export function resumenItems(items: PreordenItem[]) {
  return items.map((i) => `${i.cantidad} x ${i.descripcion}`).join(" · ").slice(0, 400);
}

export const TIPOS_SEGUIMIENTO = ["todos", "linea-blanca", "bordados", "garantia"] as const;
export type TipoSeguimiento = (typeof TIPOS_SEGUIMIENTO)[number];

export const TIPO_SEGUIMIENTO_LABEL: Record<Exclude<TipoSeguimiento, "todos">, string> = {
  "linea-blanca": "Pedido Línea Blanca",
  bordados: "Pedido Bordados",
  garantia: "Garantía",
};

export const bandejaSchema = z.object({
  token: z.string().min(1),
  tipo: z.enum(TIPOS_SEGUIMIENTO).default("todos"),
  q: z.string().trim().max(120).optional(),
});
