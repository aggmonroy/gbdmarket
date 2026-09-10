import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const listSchema = z.object({
  desde: z.string().min(10).max(10).optional(),
  hasta: z.string().min(10).max(10).optional(),
});

/**
 * Tareas visibles para el panel administrativo (calendario).
 * Incluye las tareas fijas creadas automáticamente por el sistema.
 */
export const listTareasAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q: any = supabaseAdmin
      .from("tareas")
      .select(
        "id,titulo,descripcion,tipo,origen,estado,numero_orden,fecha,fecha_vencimiento,asignado_a,verificador_a,completada_en",
      )
      .order("fecha", { ascending: false })
      .limit(2000);
    if (data.desde) q = q.gte("fecha", data.desde);
    if (data.hasta) q = q.lte("fecha", data.hasta);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: cols } = await supabaseAdmin.from("colaboradores").select("id,nombre");
    const nombres = new Map<string, string>((cols ?? []).map((c: any) => [c.id, c.nombre]));

    return (rows ?? []).map((t: any) => ({
      ...t,
      responsable: t.asignado_a ? nombres.get(t.asignado_a) ?? "—" : "Sin asignar",
      verificador: t.verificador_a ? nombres.get(t.verificador_a) ?? "—" : null,
    }));
  });
