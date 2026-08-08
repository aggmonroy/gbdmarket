import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifySesion } from "./garantias.server";

const ALLOWED_BUCKETS = new Set(["site-assets", "product-images"]);
// ~30 years in seconds — practical "forever" for a signed URL.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 30;

const fileSchema = z.object({
  bucket: z.string().refine((b) => ALLOWED_BUCKETS.has(b), "Bucket no permitido"),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(160),
  base64: z.string().min(1).max(36_000_000), // ~26 MB decodificados
});

async function guardar(data: z.infer<typeof fileSchema>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const bytes = Buffer.from(data.base64, "base64");
  const safeName = data.filename.replace(/[^\w.\-]+/g, "_");
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  const { error: upErr } = await supabaseAdmin.storage
    .from(data.bucket)
    .upload(path, bytes, { contentType: data.contentType, upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from(data.bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (sErr || !signed) throw new Error(sErr?.message ?? "No se pudo generar URL");
  return { url: signed.signedUrl, path };
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/**
 * Admin upload: acepta imágenes grandes y documentos (PDF, Office, ZIP) en
 * base64 y devuelve una URL firmada de larga duración.
 */
export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => fileSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return guardar(data);
  });

/** Carga de archivos desde el portal de colaboradores (sesión por PIN). */
export const uploadAssetPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => fileSchema.extend({ token: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
    const { token, ...rest } = data;
    return guardar(rest);
  });
