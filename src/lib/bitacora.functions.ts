import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ORIGENES = ["catalogo", "financiamiento", "garantia", "contacto", "bordados", "whatsapp"] as const;
const ESTADOS = ["pendiente", "cotizado", "en_proceso", "produccion", "listo", "entregado", "garantia", "cancelado"] as const;

export type BitacoraOrigen = (typeof ORIGENES)[number];
export type BitacoraEstado = (typeof ESTADOS)[number];

const insertSchema = z.object({
  cliente_nombre: z.string().trim().min(1).max(200),
  cliente_telefono: z.string().trim().max(60).optional().or(z.literal("")),
  cliente_email: z.string().trim().max(200).optional().or(z.literal("")),
  producto_servicio: z.string().trim().max(400).optional().or(z.literal("")),
  categoria: z.string().trim().max(120).optional().or(z.literal("")),
  origen: z.enum(ORIGENES),
  observaciones: z.string().trim().max(2000).optional().or(z.literal("")),
  meta: z.record(z.string(), z.any()).optional(),
  consent: z.literal(true),
});

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Público: cualquier visitante crea una entrada tras aceptar el consentimiento. */
export const registerBitacora = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => insertSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("bitacora")
      .insert({
        cliente_nombre: data.cliente_nombre,
        cliente_telefono: data.cliente_telefono || null,
        cliente_email: data.cliente_email || null,
        producto_servicio: data.producto_servicio || null,
        categoria: data.categoria || null,
        origen: data.origen,
        observaciones: data.observaciones || null,
        meta: data.meta ?? {},
        consent_accepted_at: new Date().toISOString(),
      } as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as any)?.id as string };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const listSchema = z.object({
  origen: z.enum(ORIGENES).optional(),
  estado: z.enum(ESTADOS).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(300),
});

export const listBitacora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q: any = (supabaseAdmin as any).from("bitacora").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.origen) q = q.eq("origen", data.origen);
    if (data.estado) q = q.eq("estado", data.estado);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.q) q = q.or(`cliente_nombre.ilike.%${data.q}%,cliente_telefono.ilike.%${data.q}%,producto_servicio.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS).optional(),
  fecha_entrega: z.string().nullable().optional(),
  observaciones: z.string().max(2000).nullable().optional(),
  producto_servicio: z.string().max(400).nullable().optional(),
  cliente_telefono: z.string().max(60).nullable().optional(),
  cliente_email: z.string().max(200).nullable().optional(),
  nota_historial: z.string().max(500).optional(),
});

export const updateBitacora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, nota_historial, ...patch } = data;
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) clean[k] = v;
    const { error } = await (supabaseAdmin as any).from("bitacora").update(clean).eq("id", id);
    if (error) throw new Error(error.message);
    if (nota_historial && clean.estado === undefined) {
      const { data: current } = await (supabaseAdmin as any).from("bitacora").select("estado").eq("id", id).single();
      await (supabaseAdmin as any).from("bitacora_historial").insert({
        bitacora_id: id,
        estado_anterior: current?.estado,
        estado_nuevo: current?.estado,
        user_id: context.userId,
        user_email: context.claims?.email ?? null,
        nota: nota_historial,
      });
    }
    return { ok: true };
  });

export const deleteBitacora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("bitacora").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listHistorial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("bitacora_historial")
      .select("*")
      .eq("bitacora_id", data.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
