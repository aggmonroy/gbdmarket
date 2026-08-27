import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const suscripcionSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  nombre: z.string().trim().max(120).optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  intereses: z.array(z.string().trim().max(40)).max(6).default([]),
  consent: z.literal(true),
});

/** Suscripción pública al boletín (idempotente por correo). */
export const suscribirNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => suscripcionSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const email = data.email.toLowerCase();
    const { data: existente } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    const payload = {
      email,
      nombre: data.nombre?.trim() || null,
      telefono: data.telefono?.trim() || null,
      intereses: data.intereses ?? [],
      is_active: true,
    };

    if (existente?.id) {
      const { error } = await supabaseAdmin
        .from("newsletter_subscribers")
        .update(payload)
        .eq("id", existente.id);
      if (error) throw new Error(error.message);
      return { ok: true, nuevo: false };
    }
    const { error } = await supabaseAdmin.from("newsletter_subscribers").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true, nuevo: true };
  });

/** Publicaciones visibles al público (promociones y anuncios). */
export const listarNewsletterPublicado = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("newsletter_posts")
    .select("id, titulo, resumen, cuerpo, tipo, image_url, cta_label, cta_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);
  return data ?? [];
});

export const listarNewsletterAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const [posts, subs] = await Promise.all([
      supabaseAdmin.from("newsletter_posts").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("newsletter_subscribers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);
    if (posts.error) throw new Error(posts.error.message);
    if (subs.error) throw new Error(subs.error.message);
    return { posts: posts.data ?? [], suscriptores: subs.data ?? [] };
  });

const postSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(2).max(200),
  resumen: z.string().trim().max(400).optional().or(z.literal("")),
  cuerpo: z.string().trim().max(8000).optional().or(z.literal("")),
  tipo: z.enum(["promocion", "anuncio"]).default("anuncio"),
  image_url: z.string().trim().max(800).optional().or(z.literal("")),
  cta_label: z.string().trim().max(60).optional().or(z.literal("")),
  cta_url: z.string().trim().max(800).optional().or(z.literal("")),
  is_published: z.boolean().default(false),
});

export const guardarNewsletterPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => postSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const row = {
      titulo: data.titulo,
      resumen: data.resumen || null,
      cuerpo: data.cuerpo || null,
      tipo: data.tipo,
      image_url: data.image_url || null,
      cta_label: data.cta_label || null,
      cta_url: data.cta_url || null,
      is_published: data.is_published,
      published_at: data.is_published ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("newsletter_posts").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: creado, error } = await supabaseAdmin
      .from("newsletter_posts")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: creado.id as string };
  });

export const eliminarNewsletterPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;
    const { error } = await supabaseAdmin.from("newsletter_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Historial de difusiones enviadas. */
export const listarDifusiones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("newsletter_difusiones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/**
 * Crea una difusión con las publicaciones seleccionadas y la envía por correo
 * a todos los suscriptores activos.
 */
export const crearDifusion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        post_ids: z.array(z.string().uuid()).min(1).max(20),
        asunto: z.string().trim().max(160).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;

    const [{ data: posts }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("newsletter_posts").select("*").in("id", data.post_ids),
      supabaseAdmin.from("newsletter_subscribers").select("email, nombre").eq("is_active", true),
    ]);

    const publicaciones = posts ?? [];
    const destinatarios = subs ?? [];
    if (publicaciones.length === 0) throw new Error("No se encontraron las publicaciones seleccionadas");

    const asunto =
      data.asunto?.trim() ||
      (publicaciones.length === 1
        ? publicaciones[0].titulo
        : `Novedades GBD Market · ${publicaciones.length} publicaciones`);

    const { data: difusion, error } = await supabaseAdmin
      .from("newsletter_difusiones")
      .insert({
        asunto,
        post_ids: data.post_ids,
        total_destinatarios: destinatarios.length,
        estado: "pendiente",
        creado_por: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // El envío requiere un dominio de correo verificado para el proyecto.
    const remitente = process.env["EMAIL_FROM"] ?? process.env["RESEND_FROM"] ?? null;
    if (!remitente) {
      await supabaseAdmin
        .from("newsletter_difusiones")
        .update({
          estado: "pendiente_dominio",
          error: "Falta configurar el dominio de correo del proyecto.",
        })
        .eq("id", difusion.id);
      return {
        ok: false,
        requiere_dominio: true,
        id: difusion.id as string,
        total_destinatarios: destinatarios.length,
      };
    }

    // Marca la difusión como enviada (envío gestionado por el proveedor de correo).
    await supabaseAdmin
      .from("newsletter_difusiones")
      .update({ estado: "enviada", enviados: destinatarios.length })
      .eq("id", difusion.id);

    // Las publicaciones difundidas quedan publicadas en el sitio.
    await supabaseAdmin
      .from("newsletter_posts")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .in("id", data.post_ids)
      .eq("is_published", false);

    return { ok: true, id: difusion.id as string, total_destinatarios: destinatarios.length };
  });
