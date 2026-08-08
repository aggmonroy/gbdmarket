import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin } from "./garantias.server";

const contactoSchema = z.object({
  channel: z.enum(["linea-blanca", "bordados"]),
  customer_name: z.string().trim().min(2).max(150),
  customer_phone: z.string().trim().min(6).max(40),
  customer_email: z.string().trim().max(160).optional().or(z.literal("")),
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  term_months: z.number().int().min(1).max(120).nullable().optional(),
  total_price: z.number().nonnegative().nullable().optional(),
  consent: z.literal(true),
});

/**
 * Público: todo clic a WhatsApp exige datos del cliente. Se registra el lead,
 * la interacción en la bitácora y su tarea pendiente de seguimiento.
 */
export const registrarContactoWhatsApp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactoSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: lead, error } = await sb
      .from("whatsapp_leads")
      .insert({
        channel: data.channel,
        product_id: data.product_id ?? null,
        product_name: data.product_name || null,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        notes: data.notes || null,
        term_months: data.term_months ?? null,
        total_price: data.total_price ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { data: bit } = await sb
      .from("bitacora")
      .insert({
        cliente_nombre: data.customer_name,
        cliente_telefono: data.customer_phone,
        cliente_email: data.customer_email || null,
        producto_servicio: data.product_name || (data.channel === "bordados" ? "Consulta de bordados" : "Consulta de Línea Blanca"),
        categoria: data.channel,
        origen: "whatsapp",
        estado: "pendiente",
        observaciones: data.notes || null,
        meta: { canal: data.channel, lead_id: (lead as any).id },
        consent_accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const { crearTareaDeOrigen } = await import("./tareas.server");
    await crearTareaDeOrigen({
      origen: "whatsapp",
      titulo: `Contacto por WhatsApp · ${data.customer_name}`,
      descripcion: [
        data.channel === "bordados" ? "Canal: Bordados" : "Canal: Línea Blanca",
        data.product_name ? `Producto: ${data.product_name}` : "",
        `Teléfono: ${data.customer_phone}`,
        data.customer_email ? `Correo: ${data.customer_email}` : "",
        data.notes ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      whatsappLeadId: (lead as any).id,
      bitacoraId: (bit as any)?.id ?? null,
    });
    return { ok: true };
  });
