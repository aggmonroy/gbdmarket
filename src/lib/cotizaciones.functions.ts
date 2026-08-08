import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Lectura/eliminación de cotizaciones desde el servidor.
 * La tabla ya no es legible desde el navegador: solo se puede consultar
 * una cotización concreta con su enlace (id exacto), nunca listarlas.
 */
const idSchema = z.object({
  id: z.string().uuid(),
  modo: z.enum(["ver", "imprimir"]),
});

export const getCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("cotizaciones")
      .select("tipo_cliente, productos, creado_en, cliente, capacidad")
      .eq("id", data.id)
      .eq("modo", data.modo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as any;
  });

/** Los enlaces de impresión son de un solo uso: se eliminan al imprimir. */
export const eliminarCotizacion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("cotizaciones")
      .delete()
      .eq("id", data.id)
      .eq("modo", "imprimir");
    return { ok: true };
  });
