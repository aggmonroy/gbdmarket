import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const EVENT_TYPES = [
  "page_view",
  "product_view",
  "whatsapp_click",
  "form_submit",
  "cta_click",
  "quote_click",
  "pwa_prompt",
  "pwa_install",
  "pwa_dismiss",
  "pwa_launch",
] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Public: register an anonymous site interaction. */
export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        event_type: z.enum(EVENT_TYPES),
        path: z.string().max(300).optional(),
        product_id: z.string().uuid().optional(),
        category_slug: z.string().max(80).optional(),
        referrer: z.string().max(500).optional(),
        session_id: z.string().max(80).optional(),
        user_agent: z.string().max(400).optional(),
        meta: z.record(z.string(), z.any()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await sb.from("page_events").insert(data as any);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Admin: usage report over a date range (or last N days). */
export const getUsageReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number; desde?: string; hasta?: string } = {}) =>
    z
      .object({
        days: z.number().int().min(1).max(365).optional(),
        desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin: any = sbAdmin;

    const usaRango = Boolean(data.desde || data.hasta);
    const days = data.days ?? 30;
    const desdeISO = usaRango
      ? new Date(`${data.desde ?? "2000-01-01"}T00:00:00.000Z`).toISOString()
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const hastaISO = usaRango && data.hasta
      ? new Date(`${data.hasta}T23:59:59.999Z`).toISOString()
      : null;

    let q = supabaseAdmin
      .from("page_events")
      .select("event_type,path,product_id,category_slug,created_at,session_id")
      .gte("created_at", desdeISO);
    if (hastaISO) q = q.lte("created_at", hastaISO);

    const [{ data: rows }, { data: products }] = await Promise.all([
      q,
      supabaseAdmin.from("products").select("id,name"),
    ]);


    const events = rows ?? [];
    const productNames = new Map<string, string>((products ?? []).map((p: any) => [p.id, p.name]));

    // Totals by event type
    const byType: Record<string, number> = {};
    // Views per day
    const perDay: Record<string, { views: number; whatsapp: number; forms: number }> = {};
    // Top pages
    const pageCounts: Record<string, number> = {};
    // Top products
    const productCounts: Record<string, number> = {};
    // Unique sessions per day
    const sessionsPerDay: Record<string, Set<string>> = {};
    // PWA per day + per page
    const pwaPerDay: Record<string, { installs: number; launches: number; prompts: number; dismissed: number }> = {};
    const pwaPerPage: Record<string, { installs: number; launches: number; prompts: number; dismissed: number }> = {};
    const PWA_KEY: Record<string, "installs" | "launches" | "prompts" | "dismissed"> = {
      pwa_install: "installs",
      pwa_launch: "launches",
      pwa_prompt: "prompts",
      pwa_dismiss: "dismissed",
    };

    for (const e of events) {
      byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
      const day = (e.created_at as string).slice(0, 10);
      perDay[day] ??= { views: 0, whatsapp: 0, forms: 0 };
      if (e.event_type === "page_view") perDay[day].views++;
      if (e.event_type === "whatsapp_click" || e.event_type === "quote_click") perDay[day].whatsapp++;
      if (e.event_type === "form_submit") perDay[day].forms++;
      if (e.event_type === "page_view" && e.path) {
        pageCounts[e.path] = (pageCounts[e.path] ?? 0) + 1;
      }
      if (e.event_type === "product_view" && e.product_id) {
        productCounts[e.product_id] = (productCounts[e.product_id] ?? 0) + 1;
      }
      const pwaKey = PWA_KEY[e.event_type as string];
      if (pwaKey) {
        pwaPerDay[day] ??= { installs: 0, launches: 0, prompts: 0, dismissed: 0 };
        pwaPerDay[day][pwaKey]++;
        const ruta = e.path || "(sin ruta)";
        pwaPerPage[ruta] ??= { installs: 0, launches: 0, prompts: 0, dismissed: 0 };
        pwaPerPage[ruta][pwaKey]++;
      }
      if (e.session_id) {
        sessionsPerDay[day] ??= new Set();
        sessionsPerDay[day].add(e.session_id);
      }
    }

    const pwaTimeseries = Object.entries(pwaPerDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, ...v }));

    const pwaByPage = Object.entries(pwaPerPage)
      .map(([path, v]) => ({ path, ...v, total: v.installs + v.launches + v.prompts + v.dismissed }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);


    const timeseries = Object.entries(perDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({
        date,
        ...v,
        unique_sessions: sessionsPerDay[date]?.size ?? 0,
      }));

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topProducts = Object.entries(productCounts)
      .map(([id, count]) => ({ id, name: productNames.get(id) ?? id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      pwa: {
        prompts: byType["pwa_prompt"] ?? 0,
        installs: byType["pwa_install"] ?? 0,
        dismissed: byType["pwa_dismiss"] ?? 0,
        launches: byType["pwa_launch"] ?? 0,
      },
      total_events: events.length,
      unique_sessions: new Set(events.map((e: any) => e.session_id).filter(Boolean)).size,
      by_type: byType,
      timeseries,
      pwa_timeseries: pwaTimeseries,
      pwa_by_page: pwaByPage,
      top_pages: topPages,
      top_products: topProducts,
      window_days: days,
      desde: desdeISO.slice(0, 10),
      hasta: hastaISO ? hastaISO.slice(0, 10) : new Date().toISOString().slice(0, 10),
    };
  });
