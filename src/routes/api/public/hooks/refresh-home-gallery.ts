import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Weekly-refreshed ambient gallery for the home page.
 * Rotates images from a curated pool of furniture + appliance scenes
 * so the section stays fresh without manual work. Admins can still edit
 * each block from /admin/contenido (section: home.gallery).
 *
 * Called weekly by pg_cron. Also safe to hit manually.
 */

// Curated pool — muebles y electrodomésticos únicamente. Sin escenas de
// construcción, obra o acabados. Se rota semanalmente en grupos de 6.
const POOL: { title: string; subtitle: string; image_url: string; cta_url: string }[] = [
  { title: "Sala en uso", subtitle: "Juego de sala y mesa de centro en el hogar", image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=sala" },
  { title: "Comedor familiar", subtitle: "Juego de comedor servido en casa", image_url: "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=comedor" },
  { title: "Recámara lista", subtitle: "Cama, colchón y cómoda en uso", image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=recamara" },
  { title: "Cocinando en casa", subtitle: "Estufa y horno en plena preparación", image_url: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=estufa" },
  { title: "Día de lavado", subtitle: "Lavadora y secadora en la lavandería", image_url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=lavadora" },
  { title: "Refrigeración en familia", subtitle: "Refrigeradora abastecida en la cocina", image_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=refrigeradora" },
  { title: "Noche de películas", subtitle: "Smart TV y mueble de sala en uso", image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=televisor" },
  { title: "Descanso con aire", subtitle: "Aire acondicionado climatizando la recámara", image_url: "https://images.unsplash.com/photo-1631545308456-511dcbf8f97b?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=aire" },
  { title: "Home office", subtitle: "Escritorio y silla en la rutina diaria", image_url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=escritorio" },
  { title: "Cocina equipada", subtitle: "Microondas y campana en el día a día", image_url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=microondas" },
  { title: "Sala contemporánea", subtitle: "Sofá modular y alfombra en el estar", image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=sofa" },
  { title: "Comedor moderno", subtitle: "Mesa y sillas para reunir a la familia", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=mesa" },
  { title: "Dormitorio principal", subtitle: "Colchón y veladores en uso", image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=cama" },
  { title: "Cocina abierta", subtitle: "Electrodomésticos trabajando en casa", image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=cocina" },
  { title: "Cuarto infantil", subtitle: "Muebles para los más pequeños", image_url: "https://images.unsplash.com/photo-1595787039714-d99ec1e6dfef?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=nino" },
  { title: "Terraza en familia", subtitle: "Muebles de exterior en uso", image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80", cta_url: "/catalogo?q=exterior" },
];
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function pickWeekly(): typeof POOL {
  const wk = isoWeek();
  const start = (wk * 3) % POOL.length; // rota 3 posiciones por semana
  const out: typeof POOL = [];
  for (let i = 0; i < 10; i++) out.push(POOL[(start + i) % POOL.length]);
  return out;
}

export const Route = createFileRoute("/api/public/hooks/refresh-home-gallery")({
  server: {
    handlers: {
      GET: ({ request }) => refresh(request),
      POST: ({ request }) => refresh(request),
    },
  },
});

/** Solo el cron autorizado puede reescribir la galería del inicio. */
function autorizado(request: Request): boolean {
  const expected = process.env['CRON_SECRET'];
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret") ?? "";
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const token = header || bearer || new URL(request.url).searchParams.get("token") || "";
  return token.length === expected.length && token === expected;
}

async function refresh(request: Request) {
  if (!autorizado(request)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing server env" }), { status: 500 });
  }
  const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
  const picks = pickWeekly();

  const rows = picks.map((p, idx) => ({
    key: `home.gallery.${idx + 1}`,
    section: "home.gallery",
    title: p.title,
    subtitle: p.subtitle,
    image_url: p.image_url,
    cta_url: p.cta_url,
    display_order: idx,
    is_active: true,
    has_draft: false,
    draft_data: null,
  }));

  const { error } = await admin
    .from("content_blocks")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(
    JSON.stringify({ ok: true, week: isoWeek(), count: rows.length }),
    { headers: { "Content-Type": "application/json" } },
  );
}
