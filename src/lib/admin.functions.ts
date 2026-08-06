import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/**
 * Bootstrap the very first admin. Creates an auth user via admin API and
 * grants admin role. Only succeeds if no admin user exists yet.
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("Ya existe un administrador. Pide una invitación.");

    const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (uErr || !created.user) throw new Error(uErr?.message ?? "No se pudo crear el usuario");

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (rErr) throw new Error(rErr.message);
    return { ok: true };
  });

/** Returns whether the cooperative already has at least one admin (for UI). */
export const hasAnyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { hasAdmin: (count ?? 0) > 0 };
});

/** An existing admin invites another admin (creates user + grants role). */
export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string }) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (uErr || !created.user) throw new Error(uErr?.message ?? "No se pudo crear el usuario");
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (rErr) throw new Error(rErr.message);
    return { ok: true };
  });

/** Lists admins (email + created_at) for the admin panel. */
export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    const out: Array<{ user_id: string; email: string; created_at: string }> = [];
    for (const r of roles ?? []) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      out.push({ user_id: r.user_id, email: u?.user?.email ?? "—", created_at: r.created_at });
    }
    return out;
  });

/** Aggregated metrics for the admin dashboard. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [products, published, featured, lowStock, embTotal, embNew, leads30] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).lte("stock", 2),
      supabaseAdmin.from("embroidery_requests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("embroidery_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabaseAdmin
        .from("whatsapp_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
    ]);

    const { data: topViewed } = await supabaseAdmin
      .from("products")
      .select("id, name, brand, views_count, quote_count")
      .order("views_count", { ascending: false })
      .limit(5);

    return {
      products: products.count ?? 0,
      published: published.count ?? 0,
      featured: featured.count ?? 0,
      lowStock: lowStock.count ?? 0,
      embroideryTotal: embTotal.count ?? 0,
      embroideryNew: embNew.count ?? 0,
      whatsappLeads30d: leads30.count ?? 0,
      topViewed: topViewed ?? [],
    };
  });

/** Lists all staff accounts with their role (admin panel · Usuarios y roles). */
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const out: Array<{ id: string; user_id: string; email: string; role: string; created_at: string }> = [];
    for (const r of roles ?? []) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      out.push({
        id: r.id,
        user_id: r.user_id,
        email: u?.user?.email ?? "—",
        role: r.role as string,
        created_at: r.created_at,
      });
    }
    return out;
  });

/** Changes a staff account's role. Only admins may edit content. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "editor" | "viewer" }) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "editor", "viewer"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("No puedes quitarte tu propio rol de administrador.");
    }
    const { error: dErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (dErr) throw new Error(dErr.message);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Creates a staff account with the given role and a temporary password. */
export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role: "admin" | "editor" | "viewer" }) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
      role: z.enum(["admin", "editor", "viewer"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (uErr || !created.user) throw new Error(uErr?.message ?? "No se pudo crear el usuario");
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (rErr) throw new Error(rErr.message);
    return { ok: true };
  });

/** Removes a staff account's access (deletes its role rows). */
export const revokeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("No puedes revocar tu propio acceso.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
