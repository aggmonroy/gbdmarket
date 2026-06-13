import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, MapPin, Clock, Instagram, Globe } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Contáctanos por WhatsApp, email o redes sociales. Línea Blanca: +507 6784-1941 · Bordados: +507 6829-8538 · Las Tablas, Panamá." },
      { property: "og:title", content: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "WhatsApp directo para cotizaciones de Línea Blanca y Bordados." },
      { property: "og:url", content: "/contacto" },
    ],
    links: [{ rel: "canonical", href: "/contacto" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Cooperativa Gladys B. de Ducasa R.L. - Línea Blanca y Bordados",
        address: { "@type": "PostalAddress", addressLocality: "Las Tablas", addressRegion: "Los Santos", addressCountry: "PA" },
        telephone: "+50767841941",
        email: "lineablanca@coopgbd.com",
        url: "https://coopgbd.com/",
      }),
    }],
  }),
  component: Contacto,
});

function Contacto() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-5xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold">Hablemos</h1>
      <p className="mt-3 text-muted-foreground">Te respondemos por WhatsApp de inmediato. Elige el canal según tu necesidad.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card title="Línea Blanca" phone="+507 6784-1941" href="https://wa.me/50767841941" />
        <Card title="Bordados" phone="+507 6829-8538" href="https://wa.me/50768298538" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Info Icon={Mail} title="Email">lineablanca@coopgbd.com</Info>
        <Info Icon={MapPin} title="Ubicación">Las Tablas, Los Santos, Panamá</Info>
        <Info Icon={Clock} title="Horario">Lun–Sáb · 8:00 AM a 5:00 PM</Info>
        <Info Icon={Globe} title="Web"><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">coopgbd.com</a></Info>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm">
        <Instagram className="h-4 w-4 text-primary" />
        <a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@gbdmuebleria</a>
      </div>
    </div>
  );
}

function Card({ title, phone, href }: { title: string; phone: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-8 hover:shadow-elevated hover:border-primary transition group">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"><MessageCircle className="h-6 w-6" /></div>
      <div className="mt-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      <div className="mt-1 font-display text-2xl font-bold">{phone}</div>
      <div className="mt-4 text-sm text-primary font-semibold group-hover:underline">Abrir chat →</div>
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
