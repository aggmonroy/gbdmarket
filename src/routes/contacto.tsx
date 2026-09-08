import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, MapPin, Clock, Instagram, Globe } from "lucide-react";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { NewsletterPosts } from "@/components/site/NewsletterPosts";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Escríbenos por WhatsApp. Suscríbete al boletín y descubre promociones. Las Tablas: +507 6784-1941 · Tonosí: +507 6871-1242 · Bordados: +507 6829-8538." },
      { property: "og:title", content: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "WhatsApp directo, boletín de promociones y canales de atención al cliente." },
    ],
    links: [{ rel: "canonical", href: "/contacto" }],
  }),
  component: Contacto,
});

const WA_LAS_TABLAS = "50767841941";
const WA_BORDADOS = "50768298538";
const WA_TONOSI = "50768711242";

function Contacto() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-10 max-w-5xl">
      <h1 className="font-display text-2xl lg:text-3xl font-bold">Hablemos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Te respondemos por WhatsApp de inmediato. Elige el canal que prefieras.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <ChannelCard title="Línea Blanca · Las Tablas" phone="+507 6784-1941" href={`https://wa.me/${WA_LAS_TABLAS}`} />
        <ChannelCard title="Mueblería GBD · Sucursal Tonosí" phone="+507 6871-1242" href={`https://wa.me/${WA_TONOSI}`} />
        <ChannelCard title="Bordados" phone="+507 6829-8538" href={`https://wa.me/${WA_BORDADOS}`} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Info Icon={Mail} title="Email">lineablanca@coopgbd.com</Info>
        <Info Icon={MapPin} title="Ubicación">Las Tablas y Tonosí · Los Santos, Panamá</Info>
        <Info Icon={Clock} title="Horario">Lun–Sáb · 8:00 AM a 5:00 PM</Info>
        <Info Icon={Globe} title="Web"><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">coopgbd.com</a></Info>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <Instagram className="h-4 w-4 text-primary" />
        <a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@gbdmuebleria</a>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.instagram.com/bordadosgbd/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@bordadosgbd</a>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3">
          <h2 className="font-display text-lg font-bold">Boletín GBD</h2>
          <p className="text-sm text-muted-foreground">Suscríbete y recibe primero nuestras ofertas y anuncios.</p>
        </div>
        <NewsletterSignup />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Novedades y promociones</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lo más reciente de la cooperativa.</p>
        <div className="mt-4">
          <NewsletterPosts />
        </div>
      </section>
    </div>
  );
}

function ChannelCard({ title, phone, href }: { title: string; phone: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card p-4 hover:shadow-elevated hover:border-primary transition group">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"><MessageCircle className="h-5 w-5" /></div>
      <div className="mt-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      <div className="mt-0.5 font-display text-lg font-bold">{phone}</div>
      <div className="mt-2 text-sm text-primary font-semibold group-hover:underline">Abrir chat →</div>
    </a>
  );
}

function Info({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <div className="mt-1.5 font-medium">{children}</div>
    </div>
  );
}
