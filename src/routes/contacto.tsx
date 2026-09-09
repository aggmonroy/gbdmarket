import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock, Instagram, Globe, PhoneCall, FileText } from "lucide-react";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { NewsletterPosts } from "@/components/site/NewsletterPosts";
import { ContactoWaDialog, type ContactoCanal } from "@/components/site/ContactoWaDialog";

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

const HORARIO_MUEBLERIA = "Lunes a sábado de 8:00 AM a 5:00 PM";
const HORARIO_COOP = "Lunes a viernes de 8:00 AM a 4:00 PM · Sábados de 8:00 AM a 12:00 PM";

const MUEBLERIA: ContactoCanal[] = [
  { title: "Mueblería GBD Las Tablas", wa: "50767841941", horario: HORARIO_MUEBLERIA },
  { title: "Mueblería GBD · Sucursal Tonosí", wa: "50768711242", horario: HORARIO_COOP },
  { title: "Bordados", wa: "50768298538", horario: HORARIO_MUEBLERIA },
];

const ATENCION: ContactoCanal[] = [
  { title: "Ingresos / Atención", wa: "50763304320", horario: HORARIO_COOP },
  { title: "Crédito 1", wa: "50769555664", horario: HORARIO_COOP },
  { title: "Crédito 2", wa: "50769554680", horario: HORARIO_COOP },
  { title: "Cobros", wa: "50763499434", horario: HORARIO_COOP },
  { title: "Contabilidad", wa: "50767321360", horario: HORARIO_COOP },
];

const FORMULARIOS = [
  { label: "¿Quieres formar parte de nuestros asociados?", url: "https://coopgbd.com/asociado/", destacado: true },
  { label: "Ahorros", url: "https://coopgbd.com/ahorros/" },
  { label: "Apoyo Económico para Lentes", url: "https://coopgbd.com/lentes/" },
  { label: "Beneficio Funerario", url: "https://coopgbd.com/funerario/" },
  { label: "Solicita tu Préstamo", url: "https://coopgbd.com/solicitar-prestamo/" },
  { label: "Bienes Adjudicados · Formulario", url: "https://coopgbd.com/bienes/" },
  { label: "Bienes Adjudicados · Consultar listado", url: "https://coopgbd.com/adjudicados/" },
];

const CARD_BASE =
  "flex min-h-[64px] min-w-0 items-center justify-center rounded-lg border p-2 text-center transition hover:shadow-elevated sm:min-h-[76px] sm:p-3";
const AZUL = "border-sky-300/70 bg-gradient-to-br from-sky-50 to-sky-100 text-sky-950 hover:border-sky-500 dark:border-sky-800/70 dark:from-sky-950 dark:to-sky-900/60 dark:text-sky-50";
const VERDE = "border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-950 hover:border-emerald-500 dark:border-emerald-800/70 dark:from-emerald-950 dark:to-emerald-900/60 dark:text-emerald-50";
const AMARILLO = "border-amber-300/70 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-950 hover:border-amber-500 dark:border-amber-800/70 dark:from-amber-950 dark:to-amber-900/60 dark:text-amber-50";
const AMARILLO_FUERTE = "border-amber-500 bg-gradient-to-br from-amber-200 to-amber-300 text-amber-950 ring-2 ring-amber-400/60 hover:border-amber-600 dark:from-amber-800 dark:to-amber-700 dark:text-amber-50";

function Contacto() {
  const [canal, setCanal] = useState<ContactoCanal | null>(null);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-6xl">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {MUEBLERIA.map((c) => (
          <button key={c.wa} type="button" onClick={() => setCanal(c)} className={`${CARD_BASE} ${AZUL}`}>
            <span className="break-words text-xs font-bold uppercase leading-tight sm:text-sm">{c.title}</span>
          </button>
        ))}
      </div>

      {/* Números de atención de la cooperativa */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <PhoneCall className="h-3.5 w-3.5 text-primary" /> Números de atención
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {ATENCION.map((c) => (
            <button key={c.wa} type="button" onClick={() => setCanal(c)} className={`${CARD_BASE} ${VERDE}`}>
              <span className="break-words text-xs font-bold uppercase leading-tight sm:text-sm">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formularios y trámites */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" /> Formularios y trámites
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {FORMULARIOS.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className={`${CARD_BASE} ${f.destacado ? AMARILLO_FUERTE : AMARILLO}`}
            >
              <span className="break-words text-xs font-bold uppercase leading-tight sm:text-sm">{f.label}</span>
            </a>
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

      <ContactoWaDialog canal={canal} onOpenChange={(o) => !o && setCanal(null)} />
    </div>
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
