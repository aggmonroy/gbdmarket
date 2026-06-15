import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, ShieldCheck, Wallet, Sparkles, Headphones, Wind, Refrigerator,
  WashingMachine, Flame, Snowflake, Microwave, CookingPot, Blend as Blender,
  Users, MapPin, Truck, BadgePercent, Store, Building2, Award, Heart, Tag, Scissors,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroLB from "@/assets/hero-linea-blanca.jpg";
import heroB from "@/assets/hero-bordados.jpg";
import logo from "@/assets/gbd-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Más de 60 años construyendo confianza para las familias panameñas. Electrodomésticos, muebles, tecnología y bordados personalizados con financiamiento cooperativo." },
      { property: "og:title", content: "Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa" },
      { property: "og:description", content: "Muebles, electrodomésticos, tecnología y bordados con respaldo cooperativo desde 1961." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const categories = [
  { slug: "aires-acondicionados", name: "Aires Acondicionados", Icon: Wind },
  { slug: "refrigeradoras", name: "Refrigeradoras", Icon: Refrigerator },
  { slug: "lavadoras", name: "Lavadoras", Icon: WashingMachine },
  { slug: "estufas", name: "Estufas", Icon: Flame },
  { slug: "congeladores", name: "Congeladores", Icon: Snowflake },
  { slug: "microondas", name: "Microondas", Icon: Microwave },
  { slug: "freidoras-aire", name: "Freidoras de Aire", Icon: CookingPot },
  { slug: "electrodomesticos-menores", name: "Menores", Icon: Blender },
];

const sucursales = [
  { name: "Sucursal Las Tablas", desc: "Atención completa en muebles, línea blanca y bordados.", Icon: Store },
  { name: "Sucursal Tonosí", desc: "Tu tienda de confianza en la región de Azuero.", Icon: Store },
  { name: "Punto de Venta Casa Matriz", desc: "Dentro de la Cooperativa Gladys B. de Ducasa.", Icon: Building2 },
  { name: "Cooperativa El Progreso de Agua Buena", desc: "Punto de venta aliado para tu comunidad.", Icon: Building2 },
];

const hitos = [
  { value: "1961", label: "Fundación de la Cooperativa" },
  { value: "2008", label: "Inicio de la Mueblería y Línea Blanca" },
  { value: "2023", label: "Inicio de la Sección de Bordados" },
  { value: "5,000+", label: "Asociados Activos" },
  { value: "Nacional", label: "Servicio de entregas según tu necesidad" },
];

const beneficios = [
  { Icon: ShieldCheck, title: "Más de 60 años de respaldo cooperativo", desc: "Solidez institucional desde 1961." },
  { Icon: Wallet, title: "Crédito y financiamiento accesible", desc: "Para asociados y clientes elegibles." },
  { Icon: Truck, title: "Entregas personalizadas", desc: "Coordinamos la entrega según tu necesidad." },
  { Icon: Headphones, title: "Atención personalizada", desc: "Asesores reales por WhatsApp y en tienda." },
  { Icon: Award, title: "Productos de marcas reconocidas", desc: "Trabajamos solo con marcas de confianza." },
  { Icon: Scissors, title: "Bordados personalizados", desc: "Uniformes, gorras, polos y más." },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20">
          <img src={heroLB} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40" />
        {/* Decorative gold blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

        <div className="container mx-auto relative px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span className="text-secondary">Cooperativa Gladys B. de Ducasa · Desde 1961</span>
            </div>

            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Más de <span className="text-secondary">60 años</span> construyendo confianza para las familias panameñas
            </h1>

            <p className="mt-5 text-lg text-primary-foreground/90 max-w-2xl">
              En <strong>Línea Blanca y Bordados GBD</strong> encontrarás muebles, electrodomésticos, tecnología,
              artículos para el hogar y servicios de bordado personalizados, respaldados por la experiencia y
              solidez de la Cooperativa Gladys B. de Ducasa, R.L.
            </p>

            <p className="mt-4 text-sm text-primary-foreground/75 max-w-2xl">
              Fundada el 11 de septiembre de 1961, hemos evolucionado de una cooperativa de ahorro y crédito a
              una organización de servicios integrales. Nuestra Sección de Línea Blanca opera desde agosto de
              2008 y nuestra Sección de Bordados desde octubre de 2023, ofreciendo calidad y respaldo en todo Panamá.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/linea-blanca" className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground hover:opacity-90 shadow-glow transition">
                Ver Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/financiamiento" className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary hover:bg-primary-foreground/90 transition">
                Solicitar Crédito
              </Link>
              <a
                href="https://wa.me/50767841941?text=Hola%2C%20deseo%20m%C3%A1s%20informaci%C3%B3n"
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-5 py-3 text-sm font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 transition"
              >
                Contactar por WhatsApp
              </a>
            </div>

            {/* Indicators */}
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <HeroStat Icon={Users} value="5,000+" label="Asociados activos" />
              <HeroStat Icon={Award} value="60+ años" label="De trayectoria" />
              <HeroStat Icon={Truck} value="Nacional" label="Ventas y entregas" />
              <HeroStat Icon={BadgePercent} value="Crédito" label="Asociados y clientes" />
            </div>
          </div>

          {/* Logo medallion */}
          <div className="relative hidden lg:flex justify-center items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-3xl" />
            <div className="relative animate-float-slow">
              <div className="absolute inset-0 rounded-full bg-secondary/30 blur-2xl scale-110" />
              <div className="relative grid place-items-center h-72 w-72 xl:h-96 xl:w-96 rounded-full bg-primary-foreground/95 shadow-glow border-4 border-secondary/60">
                <img src={logo.url} alt="Cooperativa Gladys B. de Ducasa logo institucional" className="h-56 w-56 xl:h-80 xl:w-80 object-contain" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground shadow-elevated">
                Respaldo cooperativo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUESTRA PRESENCIA */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Cobertura nacional</span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Nuestra Presencia</h2>
          <p className="mt-3 text-muted-foreground">
            Acercamos nuestros productos y servicios a más comunidades de Panamá.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sucursales.map((s) => (
            <div
              key={s.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-elevated transition"
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-secondary/20 opacity-0 group-hover:opacity-100 transition" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="mt-4 font-display font-bold text-lg">{s.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPRAS PARA TODOS */}
      <section className="container mx-auto px-4 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground p-8 lg:p-12 shadow-elevated">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-secondary/30 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-[auto_1fr_auto] items-center gap-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-glow shrink-0">
              <Tag className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">Acceso abierto</div>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">Compras para Todos</h2>
              <p className="mt-2 text-primary-foreground/90 max-w-3xl">
                Vendemos al público en general, sin necesidad de ser asociado. Sin embargo, nuestros asociados
                disfrutan de <strong className="text-secondary">beneficios exclusivos</strong>, descuentos especiales,
                facilidades de crédito y condiciones preferenciales tanto para compras al contado como financiadas.
              </p>
            </div>
            <Link to="/financiamiento" className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary hover:bg-primary-foreground/90 transition shrink-0">
              Conocer beneficios <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRAYECTORIA / ESTADÍSTICAS ANIMADAS */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Nuestra Historia</span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Una trayectoria que respalda cada compra</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {hitos.map((h, i) => (
              <div key={h.label} className="text-center animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <CountUpDisplay value={h.value} />
                <div className="mt-2 text-sm text-muted-foreground">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS LÍNEA BLANCA */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Catálogo</span>
            <h2 className="mt-2 font-display text-3xl font-bold">Explora Línea Blanca</h2>
            <p className="text-muted-foreground mt-1">Encuentra la categoría perfecta para tu hogar.</p>
          </div>
          <Link to="/linea-blanca" className="inline-flex text-sm font-semibold text-primary hover:underline">Ver todo el catálogo →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ slug, name, Icon }) => (
            <Link
              key={slug}
              to="/linea-blanca"
              search={{ cat: slug }}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display font-semibold">{name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Ver productos →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ¿POR QUÉ ELEGIRNOS? */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Compromiso cooperativo</span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">¿Por qué elegirnos?</h2>
            <p className="mt-3 text-muted-foreground">
              Seis razones para confiar en Línea Blanca y Bordados GBD.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {beneficios.map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-elevated transition">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold text-secondary-foreground shadow-soft group-hover:scale-105 transition">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-display font-bold text-lg">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BORDADOS BANNER */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="rounded-3xl overflow-hidden grid lg:grid-cols-2 bg-card shadow-elevated border border-border">
          <div className="relative aspect-[4/3] lg:aspect-auto">
            <img src={heroB} alt="Bordado corporativo personalizado" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/80">Bordados Corporativos</span>
            <h2 className="mt-2 font-display text-3xl font-bold">Tu marca, bordada con precisión</h2>
            <p className="mt-3 text-muted-foreground">
              Uniformes empresariales, camisas polo, gorras, toallas y mochilas. Carga tu diseño o trabaja con nuestro equipo creativo.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/bordados" className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Solicitar cotización
              </Link>
              <a href="https://wa.me/50768298538" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent">
                WhatsApp Bordados
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ Icon, value, label }: { Icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur px-3 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="font-display font-bold text-sm leading-tight">{value}</div>
        <div className="text-[11px] text-primary-foreground/75 leading-tight">{label}</div>
      </div>
    </div>
  );
}

function CountUpDisplay({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`font-display text-4xl sm:text-5xl font-extrabold bg-gradient-primary bg-clip-text text-transparent transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      {value}
    </div>
  );
}
