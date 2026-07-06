import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, MapPin, Store, Building2, CreditCard, Navigation,
  Briefcase, MessageCircle, ChevronLeft, ChevronRight, Scissors,
  ShieldCheck, Phone,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Muebles, electrodomésticos, tecnología y bordados con respaldo cooperativo desde 1961. Cotizaciones personalizadas por WhatsApp." },
      { property: "og:title", content: "Línea Blanca y Bordados GBD" },
      { property: "og:description", content: "Equipa tu hogar o negocio con respaldo cooperativo. Más de 60 años de confianza." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

// Hero slides — hogar + negocio en un solo banner
type HeroSlide = {
  img: string;
  eyebrow: string;
  title: string;
  sub: string;
  variant: "hogar" | "negocio";
};

const heroSlides: HeroSlide[] = [
  { img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1920&q=80", eyebrow: "Muebles y electrodomésticos", title: "Transforma tu hogar con estilo", sub: "Salas ambientadas para tu familia", variant: "hogar" },
  { img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80", eyebrow: "Soluciones empresariales", title: "¿Quieres equipar tu negocio?", sub: "Oficinas, restaurantes, hoteles, comercios, instituciones y emprendimientos. Te ayudamos con productos de calidad y opciones de financiamiento.", variant: "negocio" },
  { img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1920&q=80", eyebrow: "Recámaras completas", title: "Comodidad y diseño para tu descanso", sub: "Todo para amueblar cada espacio de tu hogar", variant: "hogar" },
  { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80", eyebrow: "Cocinas equipadas", title: "Todo lo que necesitas para tu cocina", sub: "Electrodomésticos y muebles modernos", variant: "hogar" },
  { img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1920&q=80", eyebrow: "Soluciones empresariales", title: "Amueblamos tu oficina llave en mano", sub: "Escritorios, sillería, archivo y equipamiento para tu operación.", variant: "negocio" },
  { img: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1920&q=80", eyebrow: "Lavandería y hogar", title: "Lavanderías prácticas y eficientes", sub: "Equipos con respaldo cooperativo", variant: "hogar" },
  { img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80", eyebrow: "Soluciones empresariales", title: "Restaurantes, hoteles y comercios", sub: "Ambientamos tu local con muebles y electrodomésticos.", variant: "negocio" },
];

import sucLasTablasAsset from "@/assets/sucursales/las-tablas.jpg.asset.json";
import sucTonosiAsset from "@/assets/sucursales/tonosi.jpg.asset.json";
import sucCasaMatrizAsset from "@/assets/sucursales/casa-matriz.jpg.asset.json";
import sucElProgresoAsset from "@/assets/sucursales/el-progreso.jpg.asset.json";
const sucLasTablas = sucLasTablasAsset.url;
const sucTonosi = sucTonosiAsset.url;
const sucCasaMatriz = sucCasaMatrizAsset.url;
const sucElProgreso = sucElProgresoAsset.url;

const sucursales = [
  {
    name: "Sucursal Las Tablas",
    desc: "Mueblería, bordado y sublimación.",
    img: sucLasTablas,
    Icon: Store,
    map: "https://maps.app.goo.gl/JM8N1SkeSidDgjkE7",
  },
  {
    name: "Sucursal Tonosí",
    desc: "Coop. Gladys B. de Ducasa · Tonosí.",
    img: sucTonosi,
    Icon: Store,
    map: "https://maps.app.goo.gl/jzdT4W8stzZSA7Ho7",
  },
  {
    name: "Casa Matriz",
    desc: "Punto de venta principal.",
    img: sucCasaMatriz,
    Icon: Building2,
    map: "https://maps.app.goo.gl/qFC6py7bPr4y4qQ87",
  },
  {
    name: "Coop. El Progreso – Agua Buena",
    desc: "Punto de venta aliado.",
    img: sucElProgreso,
    Icon: Building2,
    map: "https://maps.app.goo.gl/BX5osGLxJx855gHw9",
  },
];

// Fallback ambient gallery aligned with our catalog (muebles + electrodomésticos)
const FALLBACK_GALLERY: { image_url: string; title: string; subtitle: string }[] = [
  { image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80", title: "Salas modernas", subtitle: "Ambientación con nuestros muebles" },
  { image_url: "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=80", title: "Comedores familiares", subtitle: "Diseño y durabilidad" },
  { image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80", title: "Recámaras acogedoras", subtitle: "Descanso con estilo" },
  { image_url: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1200&q=80", title: "Cocinas equipadas", subtitle: "Electrodomésticos y muebles" },
  { image_url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=80", title: "Lavandería en casa", subtitle: "Equipos de línea blanca" },
  { image_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80", title: "Refrigeración", subtitle: "Marcas de confianza" },
];

const bordadosImgs = [
  { src: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80", label: "Uniformes empresariales" },
  { src: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80", label: "Camisas corporativas" },
  { src: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80", label: "Gorras bordadas" },
  { src: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80", label: "Toallas bordadas" },
  { src: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80", label: "Artículos promocionales" },
  { src: "https://images.unsplash.com/photo-1503944168849-8bf86875b08c?auto=format&fit=crop&w=800&q=80", label: "Uniformes escolares" },
];

function Home() {
  return (
    <>
      <HeroSlider />
      <AccesosRapidos />
      <AmbientGallery />
      <Sucursales />
      <Trayectoria />
      <BordadosBanner />
    </>
  );
}

/* ---------- ACCESOS RÁPIDOS ---------- */
function AccesosRapidos() {
  const items = [
    {
      to: "/financiamiento",
      Icon: CreditCard,
      title: "Financiamiento",
      desc: "Crédito cooperativo flexible de 3 a 36 meses.",
      cta: "Solicitar crédito",
    },
    {
      to: "/garantias",
      Icon: ShieldCheck,
      title: "Garantías",
      desc: "Respaldo de marca y soporte postventa.",
      cta: "Ver coberturas",
    },
    {
      to: "/contacto",
      Icon: Phone,
      title: "Contacto",
      desc: "Habla con un asesor por WhatsApp o teléfono.",
      cta: "Contáctanos",
    },
  ];
  return (
    <section className="container mx-auto px-4 lg:px-8 pb-4">
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(({ to, Icon, title, desc, cta }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-elevated transition"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold">{title}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- HERO SLIDER ---------- */
function HeroSlider() {
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((p) => (p + 1) % heroSlides.length), []);
  const prev = () => setI((p) => (p - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-slate-900">
      {heroSlides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}
        >
          <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading={idx === 0 ? "eager" : "lazy"} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto h-full px-4 lg:px-8 flex flex-col justify-end pb-16 lg:pb-24">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur ${
            heroSlides[i].variant === "negocio"
              ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
              : "border-amber-400/40 bg-amber-400/10 text-amber-300"
          }`}>
            {heroSlides[i].variant === "negocio" ? <Briefcase className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{heroSlides[i].eyebrow}</span>
          </div>
          <h1 key={i} className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] animate-fade-up drop-shadow-2xl">
            {heroSlides[i].title}
          </h1>
          <p key={`s-${i}`} className="mt-3 text-lg text-white/90 animate-fade-up max-w-xl">
            {heroSlides[i].sub}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroSlides[i].variant === "negocio" ? (
              <>
                <a
                  href="https://wa.me/50767841941?text=Hola%2C%20deseo%20una%20cotizaci%C3%B3n%20para%20mi%20negocio"
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 shadow-glow transition"
                >
                  Solicitar Cotización <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-white/10 border-2 border-white/50 backdrop-blur px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition">
                  Hablar con un Asesor
                </Link>
                <Link to="/catalogo" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90 transition">
                  Ver Catálogo
                </Link>
              </>
            ) : (
              <>
                <Link to="/catalogo" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 shadow-glow transition">
                  Ver Catálogo <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://wa.me/50767841941?text=Hola%2C%20deseo%20m%C3%A1s%20informaci%C3%B3n"
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-bold text-whatsapp-foreground hover:opacity-90 transition"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <Link to="/catalogo" search={{ tab: "bordados" }} className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/10 backdrop-blur px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition">
                  <Scissors className="h-4 w-4" /> Ver Bordados
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <button onClick={prev} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition">
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-amber-400" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- GALERÍA AMBIENTE (semanal, editable por admin) ---------- */
function AmbientGallery() {
  const { data } = useQuery({
    queryKey: ["home-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_blocks")
        .select("id,title,subtitle,image_url,cta_url,display_order")
        .eq("section", "home.gallery")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });

  const items = (data && data.length > 0 ? data : FALLBACK_GALLERY) as Array<{
    id?: string; title: string | null; subtitle: string | null; image_url: string | null; cta_url?: string | null;
  }>;

  return (
    <section className="container mx-auto px-4 lg:px-8 pb-14 pt-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Ambientaciones</span>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">Así se ven nuestros productos en casa</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Galería semanal de ambientaciones con muebles y electrodomésticos de nuestro catálogo. Solo ilustrativa — no realizamos trabajos de construcción ni acabados.
          </p>
        </div>
        <Link to="/catalogo" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Ver catálogo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.slice(0, 6).map((it, idx) => (
          <div key={it.id ?? idx} className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-muted shadow-soft">
            {it.image_url && (
              <img src={it.image_url} alt={it.title ?? ""} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="font-display font-semibold leading-tight">{it.title}</div>
              {it.subtitle && <div className="text-xs text-white/80 mt-0.5">{it.subtitle}</div>}
            </div>
          </div>
        ))}
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
                <img
                  src={s.img}
                  alt={s.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700"
                />
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
                <a
                  href={s.map} target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
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

/* ---------- TRAYECTORIA ---------- */
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

/* ---------- BORDADOS BANNER ---------- */
function BordadosBanner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % bordadosImgs.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-elevated border border-border grid lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto min-h-[320px] bg-slate-900">
          {bordadosImgs.map((b, idx) => (
            <img
              key={idx}
              src={b.src}
              alt={b.label}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900 shadow">{bordadosImgs[i].label}</span>
            <div className="flex gap-1.5">
              {bordadosImgs.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Ver ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Bordados GBD</span>
          <h2 className="mt-2 font-display text-3xl font-bold">Bordados personalizados para empresas y particulares</h2>
          <p className="mt-3 text-muted-foreground">
            Personalizamos tus prendas y artículos con acabados profesionales y atención personalizada.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {bordadosImgs.map((b) => (
              <li key={b.label} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{b.label}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://wa.me/50768298538?text=Hola%2C%20deseo%20una%20cotizaci%C3%B3n%20de%20bordados"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition"
            >
              Solicitar Cotización
            </a>
            <Link to="/catalogo" search={{ tab: "bordados" }} className="inline-flex items-center rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 transition">
              Ver Galería
            </Link>
            <a
              href="https://wa.me/50768298538" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-5 py-3 text-sm font-bold hover:bg-accent transition"
            >
              <MessageCircle className="h-4 w-4" /> Contactar Bordados
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
