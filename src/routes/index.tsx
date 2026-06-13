import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Wallet, Sparkles, Headphones, Wind, Refrigerator, WashingMachine, Flame, Snowflake, Microwave, CookingPot, Blender } from "lucide-react";
import heroLB from "@/assets/hero-linea-blanca.jpg";
import heroB from "@/assets/hero-bordados.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cooperativa Gladys B. de Ducasa R.L. · Electrodomésticos y Bordados en Las Tablas, Panamá" },
      { name: "description", content: "Aires acondicionados, refrigeradoras, lavadoras, estufas y bordados personalizados con financiamiento cooperativo. 64 años sirviendo a nuestros asociados en Los Santos, Panamá." },
      { property: "og:title", content: "Línea Blanca y Bordados · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "Electrodomésticos con financiamiento cooperativo y bordados personalizados en Panamá." },
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

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-25">
          <img src={heroLB} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/40" />
        <div className="container mx-auto relative px-4 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Línea Blanca · Bordados Corporativos
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              Equipa tu hogar con financiamiento{" "}
              <span className="text-secondary-foreground/95 underline decoration-[oklch(0.78_0.16_75)] decoration-4 underline-offset-4">cooperativo</span>.
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/85 max-w-xl">
              Aires acondicionados, refrigeradoras, lavadoras y bordados personalizados con la confianza y atención que solo da una cooperativa con 64 años en Panamá.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://wa.me/50767841941?text=Hola%2C%20deseo%20cotizar%20un%20producto"
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-5 py-3 text-sm font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 shadow-glow"
              >
                Cotizar por WhatsApp
              </a>
              <Link to="/linea-blanca" className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary hover:bg-primary-foreground/90">
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/bordados" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/40 px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">
                Solicitar bordado
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-glow border border-primary-foreground/20">
              <img src={heroLB} alt="Cocina moderna con electrodomésticos" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 lg:px-8 py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Trust Icon={ShieldCheck} title="64 años de trayectoria" desc="Cooperativa al servicio de nuestros asociados." />
          <Trust Icon={Wallet} title="Financiamiento cooperativo" desc="Plazos de 3 a 36 meses, sin intermediarios." />
          <Trust Icon={Sparkles} title="Garantía en productos seleccionados" desc="Marcas reconocidas y respaldo directo." />
          <Trust Icon={Headphones} title="Atención personalizada" desc="WhatsApp directo con nuestros asesores." />
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Explora Línea Blanca</h2>
            <p className="text-muted-foreground mt-1">Encuentra la categoría perfecta para tu hogar.</p>
          </div>
          <Link to="/linea-blanca" className="hidden sm:inline-flex text-sm font-semibold text-primary hover:underline">Ver todo el catálogo →</Link>
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

      {/* BORDADOS BANNER */}
      <section className="container mx-auto px-4 lg:px-8 pb-16">
        <div className="rounded-2xl overflow-hidden grid lg:grid-cols-2 bg-card shadow-soft border border-border">
          <div className="relative aspect-[4/3] lg:aspect-auto">
            <img src={heroB} alt="Bordado corporativo personalizado" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Bordados Corporativos</span>
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

function Trust({ Icon, title, desc }: { Icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="font-display font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
