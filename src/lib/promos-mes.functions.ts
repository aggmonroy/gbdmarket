import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  product_ids: z.array(z.string().uuid()).max(12),
});

/** Guarda (o reemplaza) la selección de promociones de un mes. Solo admin (RLS). */
export const guardarPromocionesMes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("promociones_mes")
      .upsert(
        { periodo: data.periodo, product_ids: data.product_ids, definido_por: context.userId },
        { onConflict: "periodo" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
