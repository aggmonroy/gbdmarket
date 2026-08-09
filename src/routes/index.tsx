import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MapPin, Store, Building2, CreditCard, Navigation,
  ChevronLeft, ChevronRight, Scissors,
  ShieldCheck, Phone,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { PromosBanner } from "@/components/site/PromosBanner";
import { BordadoPolicyDialogLink, SHORT_BORDADO_NOTICE } from "@/components/site/BordadoPolicy";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Muebles, electrodomésticos, tecnología y bordados con respaldo cooperativo desde 1961. Cotizaciones personalizadas por WhatsApp." },
      { property: "og:title", content: "Línea Blanca y Bordados GBD" },
      { property: "og:description", content: "Inspiración para crear el hogar que siempre has soñado." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

import sucLasTablasAsset from "@/assets/sucursales/las-tablas.jpg.asset.json";
import sucTonosiAsset from "@/assets/sucursales/tonosi.jpg.asset.json";
import sucCasaMatrizAsset from "@/assets/sucursales/casa-matriz.jpg.asset.json";
import sucElProgresoAsset from "@/assets/sucursales/el-progreso.jpg.asset.json";
const sucLasTablas = sucLasTablasAsset.url;
const sucTonosi = sucTonosiAsset.url;
const sucCasaMatriz = sucCasaMatrizAsset.url;
const sucElProgreso = sucElProgresoAsset.url;

const sucursales = [
  { name: "Sucursal Las Tablas", desc: "Mueblería, bordado y sublimación.", img: sucLasTablas, Icon: Store, map: "https://maps.app.goo.gl/JM8N1SkeSidDgjkE7" },
  { name: "Sucursal Tonosí", desc: "Coop. Gladys B. de Ducasa · Tonosí.", img: sucTonosi, Icon: Store, map: "https://maps.app.goo.gl/jzdT4W8stzZSA7Ho7" },
  { name: "Casa Matriz", desc: "Punto de venta principal.", img: sucCasaMatriz, Icon: Building2, map: "https://maps.app.goo.gl/qFC6py7bPr4y4qQ87" },
  { name: "Coop. El Progreso – Agua Buena", desc: "Punto de venta aliado.", img: sucElProgreso, Icon: Building2, map: "https://maps.app.goo.gl/BX5osGLxJx855gHw9" },
];

// Ambient gallery fallback — each item deep-links into the catalog
type GalleryItem = { image_url: string; title: string; subtitle: string; href: string; search?: Record<string, string> };

const FALLBACK_AMBIENT: GalleryItem[] = [
  { image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80", title: "Sala en uso", subtitle: "Juego de sala y mesa de centro en el hogar", href: "/catalogo", search: { q: "sala" } },
  { image_url: "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1600&q=80", title: "Comedor familiar", subtitle: "Juego de comedor servido en casa", href: "/catalogo", search: { q: "comedor" } },
  { image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80", title: "Recámara lista", subtitle: "Cama, colchón y cómoda en uso", href: "/catalogo", search: { q: "recamara" } },
  { image_url: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1600&q=80", title: "Cocinando en casa", subtitle: "Estufa y horno en plena preparación", href: "/catalogo", search: { q: "estufa" } },
  { image_url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1600&q=80", title: "Día de lavado", subtitle: "Lavadora y secadora en la lavandería", href: "/catalogo", search: { q: "lavadora" } },
  { image_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=80", title: "Refrigeración en familia", subtitle: "Refrigeradora abastecida en la cocina", href: "/catalogo", search: { q: "refrigeradora" } },
  { image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=80", title: "Noche de películas", subtitle: "Smart TV y mueble de sala en uso", href: "/catalogo", search: { q: "televisor" } },
  { image_url: "https://images.unsplash.com/photo-1631545308456-511dcbf8f97b?auto=format&fit=crop&w=1600&q=80", title: "Descanso con aire", subtitle: "Aire acondicionado climatizando la recámara", href: "/catalogo", search: { q: "aire" } },
  { image_url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1600&q=80", title: "Home office", subtitle: "Escritorio y silla en la rutina diaria", href: "/catalogo", search: { q: "escritorio" } },
  { image_url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1600&q=80", title: "Cocina equipada", subtitle: "Microondas y campana en el día a día", href: "/catalogo", search: { q: "microondas" } },
];


/** Textos aleatorios que acompañan las ambientaciones de bordados. */
const TEXTOS_BORDADOS = [
  "Identidad corporativa",
  "Bordado profesional",
  "Detalle y calidad",
  "Regalos personalizados",
  "Merchandising a medida",
  "Bordado para colegios",
  "Acabados a la medida",
  "Personalización garantizada",
];

const IMAGENES_BORDADOS = [
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1503944168849-8bf86875b08c?auto=format&fit=crop&w=1600&q=80",
];


function useGallerySection(section: string, fallback: GalleryItem[]) {
  const { data } = useQuery({
    queryKey: ["home-gallery", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_blocks")
        .select("id,title,subtitle,image_url,cta_url,display_order")
        .eq("section", section)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
  const items: GalleryItem[] = (data && data.length > 0)
    ? data.map((d) => {
        const raw = d.cta_url ?? "/catalogo";
        const [path, qs] = raw.split("?");
        const search: Record<string, string> = {};
        if (qs) new URLSearchParams(qs).forEach((v, k) => { search[k] = v; });
        return {
          image_url: d.image_url ?? "",
          title: d.title ?? "",
          subtitle: d.subtitle ?? "",
          href: path || "/catalogo",
          search,
        };
      })
    : fallback;

  return items;
}

function Home() {
  return (
    <>
      <HeroFused />
      <BordadosSection />
      <Sucursales />
      <Trayectoria />
    </>
  );
}



/* ---------- HERO FUSIONADO CON AMBIENTACIONES ---------- */
function HeroFused() {
  const items = useGallerySection("home.gallery", FALLBACK_AMBIENT);
  const [i, setI] = useState(0);

  const next = useCallback(() => setI((p) => (p + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = () => setI((p) => (p - 1 + items.length) % items.length);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, items.length]);

  const infoCards = [
    { to: "/financiamiento", Icon: CreditCard, title: "Financiamiento", desc: "Crédito cooperativo flexible de 3 a 24 meses.", cta: "Solicitar crédito" },
    { to: "/garantias", Icon: ShieldCheck, title: "Garantías", desc: "Respaldo de marca y soporte postventa.", cta: "Ver coberturas" },
    { to: "/contacto", Icon: Phone, title: "Contacto", desc: "Habla con un asesor por WhatsApp o teléfono.", cta: "Contáctanos" },
  ];

  const current = items[i];

  return (
    <section className="relative w-full overflow-hidden bg-slate-900">
      {/* Background rotating gallery */}
      <div className="relative min-h-[78vh]">
        {items.map((s, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}>
            {s.image_url && (
              <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" loading={idx === 0 ? "eager" : "lazy"} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-900/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content overlay */}
        <div className="relative z-10 container mx-auto h-full px-4 lg:px-8 py-12 lg:py-16 flex flex-col justify-between gap-6 min-h-[78vh]">
          <div className="max-w-3xl mt-4">
            <div className="font-display text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-amber-400 leading-none drop-shadow-2xl">
              Mueblería
            </div>
            <h1 key={i} className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] animate-fade-up drop-shadow-2xl">
              Siempre pensando en ti
            </h1>

            <p key={`sub-${i}`} className="mt-4 text-xl sm:text-2xl font-semibold text-amber-300 animate-fade-up">
              Inspiración para crear el hogar que siempre has soñado.
            </p>
            <p className="mt-3 text-base sm:text-lg text-white/90 max-w-2xl">
              Descubre cómo nuestros productos pueden transformar cada espacio de tu hogar.
              Te ofrecemos ideas que combinan comodidad, funcionalidad y estilo para
              ayudarte a elegir la mejor opción para tu familia.
            </p>
            <p className="mt-2 text-xs text-white/60 italic">
              Solo ilustrativa — no realizamos trabajos de construcción ni acabados.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/catalogo" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 shadow-glow transition">
                Ver Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>


          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-3">
            {infoCards.map(({ to, Icon, title, desc, cta }) => (
              <Link key={to} to={to}
                className="group flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4 hover:bg-white/20 hover:border-amber-300 transition"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-slate-900">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-white leading-tight">{title}</div>
                  <p className="text-xs text-white/80 mt-0.5">{desc}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 group-hover:text-amber-200">
                    {cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>


          <PromosBanner />


          {/* Indicadores de la galería de ambientaciones */}
          <div className="flex flex-wrap items-center gap-2">
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Ver ${it.title}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>

        </div>

        {/* Controls */}
        {items.length > 1 && (
          <>
            <button onClick={prev} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* CTA overlay for current image */}
        {current && (
          <Link
            to={current.href as any}
            search={(current.search ?? {}) as any}
            className="absolute right-4 top-4 z-20 hidden sm:inline-flex items-center gap-2 rounded-full bg-slate-900/70 backdrop-blur px-4 py-2 text-xs font-semibold text-white border border-white/20 hover:bg-slate-900/90 transition"
          >
            Ver {current.title} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}

function BordadosSection() {
  const { data: bordados = [] } = useQuery({
    queryKey: ["home-bordados-productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,images,categories!inner(slug)")
        .eq("is_published", true)
        .eq("categories.slug", "bordados")
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const items: GalleryItem[] = useMemo(() => {
    const conImagen = (bordados as any[]).filter((p) => (p.images?.[0] ?? "").length > 0);
    if (conImagen.length > 0) {
      return conImagen.map((p) => ({
        image_url: p.images[0] as string,
        title: p.name as string,
        subtitle: "",
        href: "/catalogo",
        search: { cat: "bordados" },
      }));
    }
    return IMAGENES_BORDADOS.map((image_url) => ({
      image_url,
      title: "Bordados GBD",
      subtitle: "",
      href: "/catalogo",
      search: { cat: "bordados" },
    }));
  }, [bordados]);

  /** 6 tarjetas de bordados que rotan diariamente. */
  const tarjetas = useMemo(() => {
    const pool = (bordados as any[]).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      image: (p.images?.[0] ?? "") as string,
    }));
    if (pool.length === 0) return [];
    const d = new Date();
    const dia = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    const offset = (dia * 6) % pool.length;
    return Array.from({ length: Math.min(6, pool.length) }, (_, k) => pool[(offset + k) % pool.length]);
  }, [bordados]);

  const [i, setI] = useState(0);

  const next = useCallback(() => setI((p) => (p + 1) % Math.max(items.length, 1)), [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, items.length]);

  return (
    <section className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
      <Link to="/catalogo" search={{ cat: "bordados" }} className="block">
        <div className="relative overflow-hidden rounded-2xl shadow-elevated border border-border bg-slate-900">
          {/* Fondo rotativo */}
          {items.map((s, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}>
              {s.image_url && (
                <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/70 to-slate-950/45" />
            </div>
          ))}

          <div className="relative z-10 p-3 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-900 shadow">
                <Scissors className="h-3.5 w-3.5" /> Bordados GBD
              </span>
              <span className="font-display text-sm sm:text-base font-bold uppercase tracking-wide text-white">
                Bordados personalizados
              </span>
            </div>

            <h2 className="mt-1.5 font-display text-base sm:text-xl font-bold leading-tight text-white max-w-2xl">
              Personalizamos tus prendas y artículos con acabados profesionales
            </h2>

            {tarjetas.length > 0 && (
              <div className="mt-3 grid grid-cols-6 gap-1.5 sm:gap-2.5">
                {tarjetas.map((p, k) => (
                  <div
                    key={`${p.id}-${k}`}
                    className="group overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-amber-300 transition"
                  >
                    <div className="aspect-square overflow-hidden bg-slate-800">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-white/50">
                          <Scissors className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="p-1 sm:p-2">
                      <div className="line-clamp-2 text-[9px] leading-tight sm:text-xs font-semibold text-white">{p.name}</div>
                      <span className="mt-1 hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-white/70 group-hover:text-amber-200">
                        Ver <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2.5 max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-[10px] sm:text-xs leading-snug text-white/75">
                {SHORT_BORDADO_NOTICE}
              </p>
              <BordadoPolicyDialogLink />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ---------- SUCURSALES ---------- */
function Sucursales() {
  return (
    <section className="bg-muted/40 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-primary">Cobertura</span>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold">Estamos más cerca de ti</h2>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {sucursales.map((s) => (
            <a key={s.name} href={s.map} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card hover:border-primary hover:shadow-elevated transition flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={s.img} alt={s.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg bg-white/95 text-primary shadow-soft">
                  <s.Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="p-1.5 sm:p-3 flex flex-col flex-1">
                <div className="font-display font-bold leading-tight text-[9px] sm:text-sm line-clamp-2">{s.name}</div>
                <p className="hidden sm:block mt-1 text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                <span className="mt-1 sm:mt-2 inline-flex items-center justify-center gap-1 rounded-full bg-primary px-2 py-1 sm:py-1.5 text-[9px] sm:text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
                  <Navigation className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">Cómo llegar</span><span className="sm:hidden">Ir</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- TRAYECTORIA (al final, antes del footer) ---------- */
function Trayectoria() {
  const hitos = [
    { value: "1961", label: "Fundación" },
    { value: "2008", label: "Línea Blanca" },
    { value: "2023", label: "Bordados" },
    { value: "5,000+", label: "Asociados" },
  ];
  return (
    <section className="bg-card border-y border-border">
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Trayectoria</span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold">Más de 60 años construyendo confianza</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Desde 1961 la Cooperativa Gladys B. de Ducasa ha trabajado por mejorar la calidad de vida de
              asociados y clientes, evolucionando hasta una organización de servicios integrales con presencia nacional.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {hitos.map((h, i) => (
              <div key={h.label} className="relative rounded-2xl border border-border bg-background p-4 text-center animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="font-display text-2xl sm:text-3xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">{h.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
