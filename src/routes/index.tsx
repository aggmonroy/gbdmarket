import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, Headphones, Users, MapPin, Truck, BadgePercent,
  Store, Building2, Award, HandHeart, CreditCard, Navigation, ShoppingBag,
  Briefcase, MessageCircle, ChevronLeft, ChevronRight, Scissors, Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import logo from "@/assets/gbd-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Muebles, electrodomésticos, tecnología y bordados con respaldo cooperativo desde 1961. Crédito accesible y entregas a nivel nacional." },
      { property: "og:title", content: "Línea Blanca y Bordados GBD" },
      { property: "og:description", content: "Equipa tu hogar o negocio con respaldo cooperativo. Más de 60 años de confianza." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

// Hero slides — escenarios reales
const heroSlides = [
  { img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1920&q=80", title: "Transforma tu hogar con estilo", sub: "Salas ambientadas para tu familia" },
  { img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1920&q=80", title: "Comodidad y diseño para tu descanso", sub: "Recámaras completas" },
  { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80", title: "Todo lo que necesitas para tu cocina", sub: "Cocinas modernas y equipadas" },
  { img: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1920&q=80", title: "Lavanderías prácticas y eficientes", sub: "Equipa cada espacio de tu hogar" },
  { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", title: "Equipamos tus espacios con calidad", sub: "Terrazas, exteriores y más" },
  { img: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1920&q=80", title: "Comedores que reúnen a tu familia", sub: "Diseño y durabilidad" },
  { img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80", title: "Oficinas y espacios de trabajo", sub: "Productividad con estilo" },
  { img: "https://images.unsplash.com/photo-1556909114-44e3e9399c2e?auto=format&fit=crop&w=1920&q=80", title: "Electrodomésticos premium", sub: "Marcas de confianza" },
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
    map: "https://maps.app.goo.gl/jzdT4W8stzZSA7Ho7",
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
    map: "https://maps.app.goo.gl/GynzHz7asuzRWvVa8",
  },
  {
    name: "Coop. El Progreso – Agua Buena",
    desc: "Punto de venta aliado.",
    img: sucElProgreso,
    Icon: Building2,
    map: "https://maps.app.goo.gl/BX5osGLxJx855gHw9",
  },
];

const vocacion = [
  { Icon: HandHeart, title: "Atención personalizada" },
  { Icon: CreditCard, title: "Crédito accesible" },
  { Icon: Truck, title: "Entregas programadas" },
  { Icon: Headphones, title: "Soporte postventa" },
];

const negocioImgs = [
  "https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
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
      <BusinessBanner />
      <Vocacion />
      <Sucursales />
      <ComprasParaTodos />
      <Trayectoria />
      <BordadosBanner />
    </>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Cooperativa Gladys B. de Ducasa · Desde 1961</span>
          </div>
          <h1 key={i} className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] animate-fade-up drop-shadow-2xl">
            {heroSlides[i].title}
          </h1>
          <p key={`s-${i}`} className="mt-3 text-lg text-white/90 animate-fade-up">
            {heroSlides[i].sub}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/linea-blanca" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 shadow-glow transition">
              Ver Catálogo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/financiamiento" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90 transition">
              Solicitar Crédito
            </Link>
            <a
              href="https://wa.me/50767841941?text=Hola%2C%20deseo%20m%C3%A1s%20informaci%C3%B3n"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-bold text-whatsapp-foreground hover:opacity-90 transition"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link to="/bordados" className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/10 backdrop-blur px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition">
              <Scissors className="h-4 w-4" /> Ver Bordados
            </Link>
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

      {/* Dots */}
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

/* ---------- BUSINESS BANNER ---------- */
function BusinessBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-primary text-primary-foreground">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-400/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Briefcase className="h-3.5 w-3.5" /> Soluciones empresariales
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
            ¿Quieres equipar tu <span className="text-amber-400">negocio</span>?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-primary-foreground/85 max-w-xl">
            Ofrecemos soluciones para oficinas, restaurantes, hoteles, comercios, instituciones y emprendimientos.
            Te ayudamos a equipar tu negocio con productos de calidad y opciones de financiamiento.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="https://wa.me/50767841941?text=Hola%2C%20deseo%20una%20cotizaci%C3%B3n%20para%20mi%20negocio"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 shadow-glow transition"
            >
              Solicitar Cotización <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-white/10 border-2 border-white/40 backdrop-blur px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition">
              Hablar con un Asesor
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {negocioImgs.map((src, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"} shadow-elevated ring-2 ring-amber-400/30`}>
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover hover:scale-105 transition duration-700" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- VOCACIÓN ---------- */
function Vocacion() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Nuestra vocación</span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Más que una venta, una experiencia de servicio</h2>
        <p className="mt-3 text-muted-foreground">
          Nuestro compromiso es ayudarte a encontrar la mejor solución para tu hogar, negocio o proyecto,
          con atención personalizada antes, durante y después de tu compra.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {vocacion.map(({ Icon, title }) => (
          <div key={title} className="group flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-elevated transition">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-soft group-hover:scale-110 transition">
              <Icon className="h-7 w-7" />
            </div>
            <div className="mt-4 font-display font-semibold text-sm sm:text-base">{title}</div>
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

/* ---------- COMPRAS PARA TODOS ---------- */
function ComprasParaTodos() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Para todos</span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Compra seas asociado o no</h2>
        <p className="mt-3 text-muted-foreground">
          Nuestros productos están disponibles para todo público. Los asociados disfrutan de beneficios exclusivos.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Público General */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-card p-8 hover:border-primary transition">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold">Público General</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {["Compra inmediata", "Entregas programadas", "Atención personalizada"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{t}</li>
            ))}
          </ul>
        </div>
        {/* Asociados */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground p-8 shadow-elevated">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-400/30 blur-2xl" />
          <div className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-slate-900 shadow-glow">
              <Wallet className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold">Asociados</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Crédito cooperativo", "Promociones exclusivas", "Beneficios especiales", "Mayor facilidad de financiamiento"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{t}</li>
              ))}
            </ul>
          </div>
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
            <Link to="/bordados" className="inline-flex items-center rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 transition">
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
