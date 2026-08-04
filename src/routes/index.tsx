import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MapPin, Store, Building2, CreditCard, Navigation,
  MessageCircle, ChevronLeft, ChevronRight, Scissors,
  ShieldCheck, Phone,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { registerBitacora } from "@/lib/bitacora.functions";

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
  { image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80", title: "Salas modernas", subtitle: "Muebles para tu hogar", href: "/catalogo", search: { q: "sala" } },
  { image_url: "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1600&q=80", title: "Comedores familiares", subtitle: "Diseño y durabilidad", href: "/catalogo", search: { q: "comedor" } },
  { image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80", title: "Recámaras acogedoras", subtitle: "Descanso con estilo", href: "/catalogo", search: { q: "recamara" } },
  { image_url: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1600&q=80", title: "Cocinas equipadas", subtitle: "Cocinas completas", href: "/catalogo", search: { cat: "estufas" } },
  { image_url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1600&q=80", title: "Lavandería en casa", subtitle: "Equipos de línea blanca", href: "/catalogo", search: { cat: "lavadoras" } },
  { image_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=80", title: "Refrigeración", subtitle: "Marcas de confianza", href: "/catalogo", search: { cat: "refrigeradoras" } },
];

const FALLBACK_BORDADOS: GalleryItem[] = [
  { image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80", title: "Uniformes empresariales", subtitle: "Identidad corporativa", href: "/catalogo", search: { tab: "bordados", q: "uniforme" } },
  { image_url: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1600&q=80", title: "Camisas corporativas", subtitle: "Bordado profesional", href: "/catalogo", search: { tab: "bordados", q: "camisa" } },
  { image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1600&q=80", title: "Gorras bordadas", subtitle: "Detalle y calidad", href: "/catalogo", search: { tab: "bordados", q: "gorra" } },
  { image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1600&q=80", title: "Toallas bordadas", subtitle: "Regalos personalizados", href: "/catalogo", search: { tab: "bordados", q: "toalla" } },
  { image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=80", title: "Artículos promocionales", subtitle: "Merchandising a medida", href: "/catalogo", search: { tab: "bordados", q: "promocional" } },
  { image_url: "https://images.unsplash.com/photo-1503944168849-8bf86875b08c?auto=format&fit=crop&w=1600&q=80", title: "Uniformes escolares", subtitle: "Bordado para colegios", href: "/catalogo", search: { tab: "bordados", q: "escolar" } },
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
    ? data.map((d) => ({
        image_url: d.image_url ?? "",
        title: d.title ?? "",
        subtitle: d.subtitle ?? "",
        href: d.cta_url ?? "/catalogo",
      }))
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
      <div className="relative min-h-[92vh]">
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
        <div className="relative z-10 container mx-auto h-full px-4 lg:px-8 py-16 lg:py-20 flex flex-col justify-between gap-10 min-h-[92vh]">
          <div className="max-w-3xl mt-6">
            <h1 key={i} className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] animate-fade-up drop-shadow-2xl">
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
              <button
                type="button"
                onClick={() => setCotizar(true)}
                className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-bold text-whatsapp-foreground hover:opacity-90 transition"
              >
                <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
              </button>
            </div>
            <QuoteFormDialog
              open={cotizar}
              onOpenChange={setCotizar}
              canal="linea-blanca"
              titulo="Cotizar Línea Blanca"
              meta={{ section: "home.hero" }}
            />

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

          {/* Clickable thumbnails strip */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {items.slice(0, 6).map((it, idx) => (
              <GalleryThumb key={idx} item={it} active={idx === i} onClick={() => setI(idx)} />
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

function GalleryThumb({ item, active, onClick }: { item: GalleryItem; active: boolean; onClick: () => void }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl aspect-[4/3] border-2 transition ${active ? "border-amber-400 ring-2 ring-amber-400/40" : "border-white/20 hover:border-white/60"}`}>
      <button onClick={onClick} className="absolute inset-0 z-0" aria-label={`Mostrar ${item.title}`}>
        {item.image_url && (
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
      </button>
      <Link
        to={item.href as any}
        search={(item.search ?? {}) as any}
        className="absolute inset-x-0 bottom-0 z-10 p-2 text-white pointer-events-auto"
      >
        <div className="text-xs font-display font-semibold leading-tight line-clamp-1">{item.title}</div>
        <div className="text-[10px] text-white/70 line-clamp-1">{item.subtitle}</div>
      </Link>
    </div>
  );
}

/* ---------- BORDADOS (galería estilo hero) ---------- */
function BordadosSection() {
  const items = useGallerySection("home.bordados", FALLBACK_BORDADOS);
  const [i, setI] = useState(0);
  const regBit = useServerFn(registerBitacora);
  const next = useCallback(() => setI((p) => (p + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = () => setI((p) => (p - 1 + items.length) % items.length);

  async function onCotizarWa() {
    const current = items[i];
    try {
      await regBit({ data: {
        cliente_nombre: "Visitante web",
        producto_servicio: current?.title || "Bordados",
        categoria: "bordados",
        origen: "whatsapp",
        observaciones: `Clic en Cotizar por WhatsApp desde galería bordados${current?.subtitle ? ` · ${current.subtitle}` : ""}`,
        meta: { section: "home.bordados", slide_index: i, title: current?.title, subtitle: current?.subtitle },
        consent: true,
      } as any });
    } catch (e) { console.warn(e); }
    window.open("https://wa.me/50768298538?text=Hola%2C%20deseo%20una%20cotizaci%C3%B3n%20de%20bordados", "_blank", "noopener,noreferrer");
  }


  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, items.length]);

  const current = items[i];

  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Bordados GBD</span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Bordados personalizados para empresas y particulares</h2>
        <p className="mt-3 text-muted-foreground">
          Personalizamos tus prendas y artículos con acabados profesionales y atención personalizada.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl shadow-elevated border border-border bg-slate-900">
        <div className="relative aspect-[16/9] sm:aspect-[21/9]">
          {items.map((s, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}>
              {s.image_url && (
                <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />
            </div>
          ))}

          <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10">
            {current && (
              <>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900 shadow">
                  <Scissors className="h-3.5 w-3.5" /> {current.title}
                </span>
                <div key={i} className="mt-3 max-w-xl text-white animate-fade-up">
                  <div className="font-display text-2xl sm:text-3xl font-bold leading-tight">{current.title}</div>
                  {current.subtitle && <div className="text-sm text-white/85 mt-1">{current.subtitle}</div>}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to={current.href as any}
                    search={(current.search ?? { tab: "bordados" }) as any}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-300 transition"
                  >
                    Ver categoría <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={onCotizarWa}
                    className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-bold text-whatsapp-foreground hover:opacity-90 transition"
                  >
                    <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>

          {items.length > 1 && (
            <>
              <button onClick={prev} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 right-4 z-20 flex gap-1.5">
                {items.map((_, idx) => (
                  <button key={idx} onClick={() => setI(idx)} aria-label={`Ver ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-amber-400" : "w-1.5 bg-white/60 hover:bg-white/90"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumb strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-slate-950/60 border-t border-white/10">
          {items.slice(0, 6).map((it, idx) => (
            <GalleryThumb key={idx} item={it} active={idx === i} onClick={() => setI(idx)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SUCURSALES ---------- */
function Sucursales() {
  return (
    <section className="bg-muted/40 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Cobertura</span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Estamos más cerca de ti</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sucursales.map((s) => (
            <div key={s.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary hover:shadow-elevated transition flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={s.img} alt={s.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 grid h-10 w-10 place-items-center rounded-xl bg-white/95 text-primary shadow-soft">
                  <s.Icon className="h-5 w-5" />
                </div>
                <div className="absolute bottom-2 left-3 right-3 text-white">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    <MapPin className="h-3.5 w-3.5" /> Punto de venta
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="font-display font-bold leading-tight">{s.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <a href={s.map} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
                  <Navigation className="h-4 w-4" /> Cómo llegar
                </a>
              </div>
            </div>
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
      <div className="container mx-auto px-4 lg:px-8 py-12">
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
