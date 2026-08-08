import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin } from "./garantias.server";

const solicitudSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  service_type: z.string().trim().min(2).max(120),
  quantity: z.number().int().min(1).max(100000).default(1),
  colors: z.string().trim().max(200).optional().or(z.literal("")),
  placement: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  design_url: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true),
});

/**
 * Público: registra la solicitud de bordados y crea su tarea pendiente
 * de seguimiento en Solicitudes Activas.
 */
export const crearSolicitudBordado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => solicitudSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("embroidery_requests")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        service_type: data.service_type,
        quantity: data.quantity,
        colors: data.colors || null,
        placement: data.placement || null,
        notes: data.notes || null,
        design_url: data.design_url || null,
        status: "new",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { crearTareaDeOrigen } = await import("./tareas.server");
    await crearTareaDeOrigen({
      origen: "bordados",
      titulo: `Solicitud de bordado · ${data.name}`,
      descripcion: [
        `Servicio: ${data.service_type}`,
        `Cantidad: ${data.quantity}`,
        data.colors ? `Colores: ${data.colors}` : "",
        data.placement ? `Ubicación: ${data.placement}` : "",
        `Teléfono: ${data.phone}`,
        data.email ? `Correo: ${data.email}` : "",
        data.notes ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      embroideryRequestId: (row as any).id,
    });
    return { id: (row as any).id as string };
  });
