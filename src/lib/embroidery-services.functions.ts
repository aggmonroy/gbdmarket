import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listEmbroideryServicesPublic = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("embroidery_services")
      .select("id,name,description,image_url,display_order")
      .eq("is_active", true)
      .order("display_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listEmbroideryServicesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("embroidery_services")
      .select("*")
      .order("display_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  image_url: z.string().trim().max(1000).optional().or(z.literal("")),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const upsertEmbroideryService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      display_order: data.display_order,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await (supabaseAdmin as any).from("embroidery_services").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("embroidery_services").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row?.id as string };
  });

export const deleteEmbroideryService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("embroidery_services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
