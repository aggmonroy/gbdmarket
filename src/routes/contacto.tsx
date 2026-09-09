import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock, Instagram, Globe, PhoneCall, FileText } from "lucide-react";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { NewsletterPosts } from "@/components/site/NewsletterPosts";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Escríbenos por WhatsApp. Suscríbete al boletín y descubre promociones. Mueblería GBD Las Tablas, Sucursal Tonosí y Bordados GBD." },
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

const ATENCION = [
  { label: "Ingresos / Atención", wa: "50763304320" },
  { label: "Crédito 1", wa: "50769555664" },
  { label: "Crédito 2", wa: "50769554680" },
  { label: "Cobros", wa: "50763499434" },
  { label: "Contabilidad", wa: "50767321360" },
];

const FORMULARIOS = [
  { label: "¿Quieres formar parte de nuestros asociados?", url: "https://coopgbd.com/asociado/" },
  { label: "Ahorros", url: "https://coopgbd.com/ahorros/" },
  { label: "Apoyo Económico para Lentes", url: "https://coopgbd.com/lentes/" },
  { label: "Beneficio Funerario", url: "https://coopgbd.com/funerario/" },
  { label: "Solicita tu Préstamo", url: "https://coopgbd.com/solicitar-prestamo/" },
  { label: "Bienes Adjudicados · Formulario", url: "https://coopgbd.com/bienes/" },
  { label: "Bienes Adjudicados · Consultar listado", url: "https://coopgbd.com/adjudicados/" },
];

function Contacto() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-6xl">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        <ChannelCard title="Mueblería GBD Las Tablas" href={`https://wa.me/${WA_LAS_TABLAS}`} />
        <ChannelCard title="Mueblería GBD · Sucursal Tonosí" href={`https://wa.me/${WA_TONOSI}`} />
        <ChannelCard title="Bordados" href={`https://wa.me/${WA_BORDADOS}`} />
      </div>

      {/* Números de atención · un enlace por tarjeta */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <PhoneCall className="h-3.5 w-3.5 text-primary" /> Números de atención
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {ATENCION.map((a) => (
            <ChannelCard
              key={a.wa}
              title={a.label}
              href={`https://wa.me/${a.wa}`}
            />
          ))}
        </div>
      </div>

      {/* Formularios y trámites · un enlace por tarjeta */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" /> Formularios y trámites
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {FORMULARIOS.map((f) => (
            <ChannelCard
              key={f.url}
              title={f.label}
              href={f.url}
              action="Abrir formulario →"
            />
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-2">
          <h2 className="font-display text-base font-bold">Boletín GBD</h2>
          <p className="text-xs text-muted-foreground">Suscríbete y recibe primero nuestras ofertas y anuncios.</p>
        </div>
        <NewsletterSignup />
      </section>

      <section className="mt-5">
        <h2 className="font-display text-lg font-bold">Novedades y promociones</h2>
        <div className="mt-3">
          <NewsletterPosts />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-4 gap-1 text-[9px] sm:gap-2 sm:text-xs">
        <Info Icon={Mail} title="Email">lineablanca@coopgbd.com</Info>
        <Info Icon={MapPin} title="Ubicación">Las Tablas y Tonosí · Los Santos</Info>
        <Info Icon={Clock} title="Horario">Lun–Sáb · 8:00 AM a 5:00 PM</Info>
        <Info Icon={Globe} title="Web"><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">coopgbd.com</a></Info>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] sm:text-xs">
        <Instagram className="h-3.5 w-3.5 text-primary" />
        <a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@gbdmuebleria</a>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.instagram.com/bordadosgbd/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@bordadosgbd</a>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.instagram.com/coopgladysducasa/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@coopgladysducasa</a>
      </div>
    </div>
  );
}

function ChannelCard({
  title,
  href,
  action = "Abrir chat →",
}: {
  title: string;
  href: string;
  action?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex min-h-full min-w-0 flex-col justify-between rounded-lg border border-border bg-card p-2 hover:shadow-elevated hover:border-primary transition group text-center sm:p-3 sm:text-left">
      <div className="break-words text-xs font-bold uppercase leading-tight text-foreground sm:text-sm">{title}</div>
      <div className="mt-2 text-xs font-semibold text-primary group-hover:underline sm:text-sm">{action}</div>
    </a>
  );
}

function Info({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border p-1.5 sm:p-2">
      <div className="flex items-center gap-1 text-[8px] font-semibold uppercase text-muted-foreground sm:text-[10px]">
        <Icon className="h-3 w-3 shrink-0" /> {title}
      </div>
      <div className="mt-0.5 break-words font-medium leading-tight">{children}</div>
    </div>
  );
}
