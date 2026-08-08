import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifySesion } from "./garantias.server";
import { leerFichaDesdeUrl } from "./ai-product.server";

const urlSchema = z.object({ url: z.string().trim().url().max(2000) });
const urlPortalSchema = urlSchema.extend({ token: z.string().min(1) });

async function categorias() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("categories").select("name").order("display_order");
  return (data ?? []).map((c: any) => c.name as string);
}

/** Panel administrativo: genera la ficha desde el enlace del proveedor. */
export const leerFichaProveedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => urlSchema.parse(d))
  .handler(async ({ data }) => leerFichaDesdeUrl(data.url, await categorias()));

/** Portal de colaboradores (sesión por PIN): misma lectura con IA. */
export const leerFichaProveedorPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => urlPortalSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    return leerFichaDesdeUrl(data.url, await categorias());
  });
