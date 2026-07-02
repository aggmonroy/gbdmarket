import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const ALLOWED_BUCKETS = new Set(["site-assets", "product-images"]);
// ~30 years in seconds — practical "forever" for a signed URL.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 30;

/**
 * Admin upload: accepts a base64-encoded file and stores it in the given
 * bucket. Returns a long-lived signed URL that the site can use as image src.
 */
export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bucket: string; filename: string; contentType: string; base64: string }) =>
    z.object({
      bucket: z.string().refine((b) => ALLOWED_BUCKETS.has(b), "Bucket no permitido"),
      filename: z.string().min(1).max(200),
      contentType: z.string().min(1).max(120),
      base64: z.string().min(1).max(15_000_000), // ~11MB decoded
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
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
  });
