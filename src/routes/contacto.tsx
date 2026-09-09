import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, MapPin, Clock, Instagram, Globe, Landmark, PhoneCall, FileText, ExternalLink } from "lucide-react";
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

const ATENCION = [
  { label: "Ingresos / Atención", phone: "+507 6330-4320", wa: "50763304320" },
  { label: "Crédito 1", phone: "+507 6955-5664", wa: "50769555664" },
  { label: "Crédito 2", phone: "+507 6955-4680", wa: "50769554680" },
  { label: "Cobros", phone: "+507 6349-9434", wa: "50763499434" },
  { label: "Contabilidad", phone: "+507 6732-1360", wa: "50767321360" },
];

const FORMULARIOS = [
  { label: "¿Quieres formar parte de nuestros asociados?", url: "https://coopgbd.com/asociado/" },
  { label: "Ahorros", url: "https://coopgbd.com/ahorros/" },
  { label: "Apoyo Económico para Lentes", url: "https://coopgbd.com/lentes/" },
  { label: "Beneficio Funerario", url: "https://coopgbd.com/funerario/" },
  { label: "Solicita tu Préstamo", url: "https://coopgbd.com/solicitar-prestamo/" },
];

function Contacto() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-6xl">
      <h1 className="font-display text-xl lg:text-2xl font-bold">Hablemos</h1>
      <p className="mt-1 text-xs text-muted-foreground">Te respondemos por WhatsApp de inmediato. Elige el canal que prefieras.</p>

      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
        <ChannelCard title="Línea Blanca · Las Tablas" phone="+507 6784-1941" href={`https://wa.me/${WA_LAS_TABLAS}`} />
        <ChannelCard title="Mueblería GBD · Tonosí" phone="+507 6871-1242" href={`https://wa.me/${WA_TONOSI}`} />
        <ChannelCard title="Bordados" phone="+507 6829-8538" href={`https://wa.me/${WA_BORDADOS}`} />
      </div>

      <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
        <Info Icon={Mail} title="Email">lineablanca@coopgbd.com</Info>
        <Info Icon={MapPin} title="Ubicación">Las Tablas y Tonosí · Los Santos</Info>
        <Info Icon={Clock} title="Horario">Lun–Sáb · 8:00 AM a 5:00 PM</Info>
        <Info Icon={Globe} title="Web"><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">coopgbd.com</a></Info>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <Instagram className="h-3.5 w-3.5 text-primary" />
        <a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@gbdmuebleria</a>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.instagram.com/bordadosgbd/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@bordadosgbd</a>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.instagram.com/coopgladysducasa/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@coopgladysducasa</a>
      </div>

      {/* Servicios de la Cooperativa */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-3">
        <a
          href="https://bancagbd.com/bancagbd/login/"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-border bg-card p-3 hover:shadow-elevated hover:border-primary transition group"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Landmark className="h-4 w-4" /></div>
          <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Cooperativa GBD</div>
          <div className="font-display text-sm font-bold leading-tight">Banca en línea</div>
          <div className="mt-1 text-[11px] text-primary font-semibold group-hover:underline inline-flex items-center gap-1">Ingresar <ExternalLink className="h-3 w-3" /></div>
        </a>

        <div className="rounded-xl border border-border bg-card p-3 col-span-2 lg:col-span-1">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><PhoneCall className="h-4 w-4" /></div>
          <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Cooperativa GBD</div>
          <div className="font-display text-sm font-bold">Números de atención</div>
          <ul className="mt-1.5 space-y-1 text-[11px]">
            {ATENCION.map((a) => (
              <li key={a.wa} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground truncate">{a.label}</span>
                <a href={`https://wa.me/${a.wa}`} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline shrink-0">{a.phone}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 col-span-2 lg:col-span-1">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><FileText className="h-4 w-4" /></div>
          <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Cooperativa GBD</div>
          <div className="font-display text-sm font-bold">Formularios y trámites</div>
          <ul className="mt-1.5 space-y-1 text-[11px]">
            {FORMULARIOS.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                  {f.label} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
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
    </div>
  );
}

function ChannelCard({ title, phone, href }: { title: string; phone: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card p-2 sm:p-3 hover:shadow-elevated hover:border-primary transition group text-center sm:text-left">
      <div className="mx-auto sm:mx-0 grid h-8 w-8 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"><MessageCircle className="h-4 w-4" /></div>
      <div className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-muted-foreground leading-tight">{title}</div>
      <div className="mt-0.5 font-display text-xs sm:text-base font-bold leading-tight">{phone}</div>
      <div className="mt-1 text-[10px] sm:text-xs text-primary font-semibold group-hover:underline">Abrir chat →</div>
    </a>
  );
}

function Info({ Icon, title, children }: { Icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <div className="mt-0.5 font-medium leading-tight">{children}</div>
    </div>
  );
}
