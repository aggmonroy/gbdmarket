import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifySesion } from "./garantias.server";

const ALLOWED_BUCKETS = new Set(["site-assets", "product-images"]);
// Bucket propio del portal por PIN: nunca toca el branding ni el catálogo público.
const PORTAL_BUCKET = "portal-uploads";
// ~30 years in seconds — practical "forever" for a signed URL.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 30;
// Formularios públicos: enlaces temporales suficientes para seguimiento por WhatsApp.
const PUBLIC_SIGNED_URL_TTL = 60 * 60 * 24 * 180;

const fileSchema = z.object({
  bucket: z.string().refine((b) => ALLOWED_BUCKETS.has(b), "Bucket no permitido"),
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .min(1)
    .max(160)
    .refine(
      (t) => !/svg|xhtml|text\/html|javascript/i.test(t),
      "Formato no permitido: convierte la imagen a PNG o JPG",
    ),
  base64: z.string().min(1).max(36_000_000), // ~26 MB decodificados
});

const publicFileSchema = z
  .object({
    folder: z.enum(["contacto", "yappy"]),
    filename: z.string().min(1).max(200),
    contentType: z
      .string()
      .min(1)
      .max(160)
      .refine(
        (t) =>
          /^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/i.test(t),
        "Formato permitido: imagen, PDF, Word o Excel",
      ),
    base64: z.string().min(1).max(36_000_000), // ~26 MB decodificados
  })
  .superRefine((data, ctx) => {
    if (data.folder === "yappy" && !/^image\//i.test(data.contentType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contentType"], message: "El comprobante de Yappy debe ser una imagen" });
    }
  });

async function guardar(
  data: { bucket: string; filename: string; contentType: string; base64: string },
  ttl = SIGNED_URL_TTL,
  prefix = "",
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const bytes = Buffer.from(data.base64, "base64");
  const safeName = data.filename.replace(/[^\w.\-]+/g, "_");
  const safePrefix = prefix.replace(/[^\w\-\/]+/g, "").replace(/^\/+|\/+$/g, "");
  const basename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  const path = safePrefix ? `${safePrefix}/${basename}` : basename;
  const { error: upErr } = await supabaseAdmin.storage
    .from(data.bucket)
    .upload(path, bytes, { contentType: data.contentType, upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from(data.bucket)
    .createSignedUrl(path, ttl);
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
    const { token, bucket, ...rest } = data;
    // Solo un administrador con sesión real puede escribir en los buckets del sitio.
    return guardar({ ...rest, bucket: s.rol === "admin" ? bucket : PORTAL_BUCKET });
  });

/** Carga pública para formularios: guarda comprobantes o adjuntos y devuelve enlace temporal. */
export const uploadPublicAttachment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => publicFileSchema.parse(d))
  .handler(async ({ data }) => {
    const { folder, ...rest } = data;
    return guardar({ ...rest, bucket: PORTAL_BUCKET }, PUBLIC_SIGNED_URL_TTL, folder);
  });
