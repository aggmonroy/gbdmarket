import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  product_ids: z.array(z.string().uuid()).max(12),
});

function periodoLegible(periodo: string) {
  const [y, m] = periodo.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString("es-PA", {
    month: "long",
    year: "numeric",
  });
}

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

    // Cada actualización de promociones del mes genera/actualiza una publicación del boletín.
    try {
      const { data: productos } = await context.supabase
        .from("products")
        .select("id, name, images")
        .in("id", data.product_ids.length ? data.product_ids : ["00000000-0000-0000-0000-000000000000"]);

      const nombres = (productos ?? []).map((p: any) => p.name).filter(Boolean);
      const imagen = (productos ?? []).find((p: any) => (p.images ?? []).length)?.images?.[0] ?? null;
      const legible = periodoLegible(data.periodo);
      const titulo = `Promociones del mes · ${legible}`;

      const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
      const supabaseAdmin: any = sbAdmin;
      const row = {
        titulo,
        resumen: nombres.length
          ? `${nombres.length} artículos en promoción durante ${legible}.`
          : `Muy pronto anunciaremos las promociones de ${legible}.`,
        cuerpo: nombres.length ? nombres.map((n: string) => `• ${n}`).join("\n") : null,
        tipo: "promocion",
        image_url: imagen,
        cta_label: "Ver promociones",
        cta_url: "/catalogo",
        is_published: false,
      };

      const { data: existente } = await supabaseAdmin
        .from("newsletter_posts")
        .select("id")
        .eq("titulo", titulo)
        .maybeSingle();

      if (existente?.id) {
        await supabaseAdmin.from("newsletter_posts").update(row).eq("id", existente.id);
      } else {
        await supabaseAdmin.from("newsletter_posts").insert(row);
      }
    } catch {
      /* la publicación del boletín es complementaria; no bloquea el guardado */
    }

    return { ok: true };
  });
