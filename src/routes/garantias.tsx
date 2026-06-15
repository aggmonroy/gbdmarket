import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ShieldCheck, Phone, MessageCircle, Upload, AlertCircle, Headphones, PhoneCall,
  CheckCircle2, GraduationCap, Sparkles, MapPin, CalendarDays, Smartphone, Wrench, Users,
} from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP_LINEA_BLANCA } from "@/lib/whatsapp";

export const Route = createFileRoute("/garantias")({
  head: () => ({
    meta: [
      { title: "Garantías y Servicio Post-Venta · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Contacta directo con las marcas o solicita apoyo de un agente. Además agenda orientación para usar tu nuevo electrodoméstico." },
      { property: "og:title", content: "Garantías y Servicio Post-Venta" },
      { property: "og:description", content: "Centros de atención oficiales, asistencia personalizada y agenda de orientación de producto." },
      { property: "og:url", content: "/garantias" },
    ],
    links: [{ rel: "canonical", href: "/garantias" }],
  }),
  component: Garantias,
});

type Mode = "directo" | "agente";

type CallCenter = {
  brand: string;
  phone: string;
  label: string;
  brandKey: string;
};

const BRAND_CALL_CENTERS: CallCenter[] = [
  { brand: "PREMIER", brandKey: "Premier", phone: "+507 6258-2831", label: "Servicio al Cliente" },
  { brand: "NST", brandKey: "NST", phone: "+507 266-2222 ext. 1", label: "Call Center" },
  { brand: "NISATO", brandKey: "Nisato", phone: "+507 6980-2070", label: "Servicio Técnico" },
  { brand: "SAMSUNG", brandKey: "Samsung", phone: "+507 800-0101", label: "Centro de Atención" },
  { brand: "MIDEA", brandKey: "Midea", phone: "+507 800-0101", label: "Centro de Atención" },
];

const SUCURSALES = ["Sucursal Las Tablas", "Sucursal Tonosí", "Punto de Venta Casa Matriz"] as const;
const MARCAS = ["Premier", "NST", "Nisato", "Samsung", "Midea", "Otra"] as const;

const formSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa tu nombre completo").max(120),
  cedula: z.string().trim().min(4, "Ingresa tu cédula").max(40),
  fechaCompra: z.string().min(1, "Ingresa la fecha de compra"),
  factura: z.string().trim().min(1, "Ingresa el número de factura").max(60),
  modelo: z.string().trim().min(1, "Ingresa el modelo del artículo").max(120),
  serie: z.string().trim().min(1, "Ingresa el número de serie").max(120),
  telefono: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  marca: z.string().trim().min(1, "Selecciona la marca"),
  lugarCompra: z.string().trim().min(1, "Selecciona dónde realizó la compra"),
  descripcion: z.string().trim().min(15, "Describe el daño con más detalle (mín. 15 caracteres)").max(1500),
});
type FormData = z.infer<typeof formSchema>;

const citaSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa tu nombre completo").max(120),
  telefono: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  email: z.string().trim().email("Ingresa un correo válido").max(160),
  producto: z.string().trim().min(2, "Indica el producto").max(120),
  marca: z.string().trim().min(1, "Selecciona la marca"),
  fecha: z.string().min(1, "Selecciona una fecha"),
  modalidad: z.enum(["Presencial", "Virtual"]),
  lugarCompra: z.string().trim().min(1, "Selecciona dónde realizó la compra"),
  comentarios: z.string().trim().max(800).optional().or(z.literal("")),
});
type CitaData = z.infer<typeof citaSchema>;

const initialForm: FormData = {
  nombre: "", cedula: "", fechaCompra: "", factura: "", modelo: "", serie: "",
  telefono: "", marca: "", lugarCompra: "", descripcion: "",
};
const initialCita: CitaData = {
  nombre: "", telefono: "", email: "", producto: "", marca: "",
  fecha: "", modalidad: "Presencial", lugarCompra: "", comentarios: "",
};

function Garantias() {
  const [mode, setMode] = useState<Mode>("directo");
  const [form, setForm] = useState<FormData>(initialForm);
  const [files, setFiles] = useState<{ fotos: File[]; videos: File[] }>({ fotos: [], videos: [] });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [agentTarget, setAgentTarget] = useState<string | null>(null);

  const [cita, setCita] = useState<CitaData>(initialCita);
  const [citaErrors, setCitaErrors] = useState<Partial<Record<keyof CitaData, string>>>({});

  const updateForm = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const updateCita = (k: keyof CitaData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setCita((f) => ({ ...f, [k]: e.target.value }));

  const waMessage = useMemo(() => {
    const header = agentTarget
      ? `*Solicitud de asistencia — ${agentTarget}*`
      : "*Reporte de Garantía / Servicio Post-Venta*";
    return [
      header, "",
      `• Nombre: ${form.nombre || "—"}`,
      `• Cédula: ${form.cedula || "—"}`,
      `• Teléfono: ${form.telefono || "—"}`,
      `• Fecha de compra: ${form.fechaCompra || "—"}`,
      `• N° de factura: ${form.factura || "—"}`,
      `• Lugar de compra: ${form.lugarCompra || "—"}`,
      `• Marca: ${form.marca || "—"}`,
      `• Modelo: ${form.modelo || "—"}`,
      `• N° de serie: ${form.serie || "—"}`,
      "", "*Descripción del daño:*", form.descripcion || "—", "",
      `Adjuntaré ${files.fotos.length} foto(s) y ${files.videos.length} video(s) en este chat.`,
    ].join("\n");
  }, [form, files, agentTarget]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof FormData, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormData;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      toast.error("Revisa los campos marcados");
      return;
    }
    setErrors({});
    toast.success("Abriendo WhatsApp con tu solicitud…");
    const url = `https://wa.me/${WHATSAPP_LINEA_BLANCA}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onSubmitCita(e: React.FormEvent) {
    e.preventDefault();
    const parsed = citaSchema.safeParse(cita);
    if (!parsed.success) {
      const errs: Partial<Record<keyof CitaData, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof CitaData;
        if (!errs[k]) errs[k] = issue.message;
      }
      setCitaErrors(errs);
      toast.error("Revisa los campos marcados");
      return;
    }
    setCitaErrors({});
    const msg = [
      "*Solicitud de orientación de producto*", "",
      `• Nombre: ${cita.nombre}`,
      `• Teléfono: ${cita.telefono}`,
      `• Correo: ${cita.email}`,
      `• Producto: ${cita.producto}`,
      `• Marca: ${cita.marca}`,
      `• Fecha deseada: ${cita.fecha}`,
      `• Modalidad: ${cita.modalidad}`,
      `• Lugar de compra: ${cita.lugarCompra}`,
      cita.comentarios ? `• Comentarios: ${cita.comentarios}` : "",
    ].filter(Boolean).join("\n");
    toast.success("¡Solicitud enviada! Te contactaremos para confirmar la cita.");
    const url = `https://wa.me/${WHATSAPP_LINEA_BLANCA}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openAgentForm(brand?: string) {
    setMode("agente");
    if (brand) {
      setAgentTarget(brand);
      setForm((f) => ({ ...f, marca: MARCAS.includes(brand as any) ? brand : "Otra" }));
    } else {
      setAgentTarget(null);
    }
    setTimeout(() => {
      document.getElementById("agente-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Garantías y servicio post-venta</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Contacta directamente al call center oficial de tu marca o solicita apoyo personalizado de uno de nuestros agentes.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ModeCard active={mode === "directo"} onClick={() => setMode("directo")} Icon={PhoneCall}
          title="Contacto directo con la marca"
          desc="Llama al call center oficial del fabricante." />
        <ModeCard active={mode === "agente"} onClick={() => { setAgentTarget(null); setMode("agente"); }} Icon={Headphones}
          title="Hablar con un agente"
          desc="Te ayudamos a gestionar la garantía vía WhatsApp." />
      </div>

      {mode === "directo" ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Call Centers Oficiales</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Llama directamente al servicio técnico oficial de la marca de tu equipo.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BRAND_CALL_CENTERS.map((b) => (
                <article key={b.brand}
                  className="group rounded-2xl border border-border bg-gradient-to-br from-card to-primary-soft/30 p-5 hover:border-primary hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-secondary-foreground bg-secondary/30 px-2 py-1 rounded-full">
                      OFICIAL
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{b.brand}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">{b.label}</div>
                  <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}
                    className="mt-2 inline-block text-base font-semibold text-primary hover:underline">
                    {b.phone}
                  </a>
                  <button type="button" onClick={() => openAgentForm(b.brandKey)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition">
                    <Headphones className="h-4 w-4" /> Solicitar Asistencia
                  </button>
                </article>
              ))}

              {/* Otras marcas */}
              <article className="rounded-2xl border-2 border-dashed border-secondary/60 bg-secondary/10 p-5 flex flex-col">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">OTRAS MARCAS</h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">
                  Si su marca no aparece en este listado, complete el formulario y uno de nuestros agentes le brindará la información de contacto correspondiente.
                </p>
                <button type="button" onClick={() => openAgentForm("Otra marca")}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
                  <Headphones className="h-4 w-4" /> Solicitar Asistencia
                </button>
              </article>
            </div>

            <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Ten a mano tu factura, modelo y número de serie. Si prefieres que un agente nuestro gestione el reporte,
                cambia a <button type="button" onClick={() => openAgentForm()} className="text-primary font-semibold hover:underline">Hablar con un agente</button>.
              </span>
            </div>
          </div>
        </section>
      ) : (
        <form id="agente-form" onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold">
              {agentTarget ? `Solicitar asistencia — ${agentTarget}` : "Datos del reporte"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Completa la información. Al enviar se abrirá WhatsApp con todos los datos. Allí podrás adjuntar fotos y videos del daño.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" error={errors.nombre}>
              <input value={form.nombre} onChange={updateForm("nombre")} className={inputCls} placeholder="Juan Pérez" />
            </Field>
            <Field label="Número de cédula" error={errors.cedula}>
              <input value={form.cedula} onChange={updateForm("cedula")} className={inputCls} placeholder="8-123-456" />
            </Field>
            <Field label="Teléfono de contacto" error={errors.telefono}>
              <input type="tel" value={form.telefono} onChange={updateForm("telefono")} className={inputCls} placeholder="+507 6000-0000" />
            </Field>
            <Field label="Fecha de compra" error={errors.fechaCompra}>
              <input type="date" value={form.fechaCompra} onChange={updateForm("fechaCompra")} className={inputCls} />
            </Field>
            <Field label="Número de factura" error={errors.factura}>
              <input value={form.factura} onChange={updateForm("factura")} className={inputCls} placeholder="F-00001234" />
            </Field>
            <Field label="¿Dónde realizó su compra?" error={errors.lugarCompra}>
              <select value={form.lugarCompra} onChange={updateForm("lugarCompra")} className={inputCls}>
                <option value="">Selecciona…</option>
                {SUCURSALES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Marca del producto" error={errors.marca}>
              <select value={form.marca} onChange={updateForm("marca")} className={inputCls}>
                <option value="">Selecciona…</option>
                {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Modelo del artículo" error={errors.modelo}>
              <input value={form.modelo} onChange={updateForm("modelo")} className={inputCls} placeholder="Ej: GR-B252SQB" />
            </Field>
            <Field label="Número de serie" error={errors.serie}>
              <input value={form.serie} onChange={updateForm("serie")} className={inputCls} placeholder="SN-XXXXXXXX" />
            </Field>
          </div>

          <Field label="Descripción completa del daño" error={errors.descripcion}>
            <textarea value={form.descripcion} onChange={updateForm("descripcion")} rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe la falla: cuándo empezó, qué sucede, ruidos, mensajes de error, etc." />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileField label="Fotos del equipo / daño" accept="image/*" files={files.fotos}
              onChange={(fs) => setFiles((p) => ({ ...p, fotos: fs }))} />
            <FileField label="Videos (opcional)" accept="video/*" files={files.videos}
              onChange={(fs) => setFiles((p) => ({ ...p, videos: fs }))} />
          </div>
          <p className="text-xs text-muted-foreground -mt-2 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Las fotos y videos se adjuntan directamente en el chat de WhatsApp que se abrirá al enviar el reporte.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-whatsapp px-5 py-3 text-sm font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 shadow-glow">
              <MessageCircle className="h-4 w-4" /> Enviar reporte por WhatsApp
            </button>
            <button type="button" onClick={() => { setAgentTarget(null); setMode("directo"); }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent">
              Prefiero contactar a la marca directamente
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: Help using your product */}
      <section className="mt-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-8 sm:p-10 shadow-soft relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">
                <GraduationCap className="h-3.5 w-3.5" /> Orientación personalizada
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight">
                ¿Necesitas que te expliquemos cómo usar tu artículo nuevo?
              </h2>
              <p className="mt-4 text-primary-foreground/90 text-base">
                Nuestro equipo puede ayudarte a conocer las funciones, configuraciones y cuidados básicos de tu producto
                para que aproveches al máximo tu compra.
              </p>
              <p className="mt-3 text-secondary font-semibold">
                Agenda una cita y uno de nuestros especialistas te brindará orientación personalizada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FeatureTile Icon={Wrench} title="Electrodomésticos" desc="Lavadoras, neveras, estufas" />
              <FeatureTile Icon={Smartphone} title="Tecnología" desc="Smart TVs, audio, smart home" />
              <FeatureTile Icon={Users} title="Atención al cliente" desc="Acompañamiento real" />
              <FeatureTile Icon={GraduationCap} title="Capacitación" desc="Soporte y orientación" />
            </div>
          </div>
        </div>

        {/* Cita form */}
        <form onSubmit={onSubmitCita} className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl font-bold">Agenda tu cita</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" error={citaErrors.nombre}>
              <input value={cita.nombre} onChange={updateCita("nombre")} className={inputCls} placeholder="Juan Pérez" />
            </Field>
            <Field label="Teléfono" error={citaErrors.telefono}>
              <input type="tel" value={cita.telefono} onChange={updateCita("telefono")} className={inputCls} placeholder="+507 6000-0000" />
            </Field>
            <Field label="Correo electrónico" error={citaErrors.email}>
              <input type="email" value={cita.email} onChange={updateCita("email")} className={inputCls} placeholder="tucorreo@ejemplo.com" />
            </Field>
            <Field label="Producto adquirido" error={citaErrors.producto}>
              <input value={cita.producto} onChange={updateCita("producto")} className={inputCls} placeholder="Ej: Refrigeradora 14 pies" />
            </Field>
            <Field label="Marca" error={citaErrors.marca}>
              <select value={cita.marca} onChange={updateCita("marca")} className={inputCls}>
                <option value="">Selecciona…</option>
                {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Fecha deseada" error={citaErrors.fecha}>
              <input type="date" value={cita.fecha} onChange={updateCita("fecha")} className={inputCls} />
            </Field>
            <Field label="Modalidad de atención" error={citaErrors.modalidad}>
              <select value={cita.modalidad} onChange={updateCita("modalidad")} className={inputCls}>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
              </select>
            </Field>
            <Field label="Lugar de compra" error={citaErrors.lugarCompra}>
              <select value={cita.lugarCompra} onChange={updateCita("lugarCompra")} className={inputCls}>
                <option value="">Selecciona…</option>
                {SUCURSALES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Comentarios adicionales (opcional)" error={citaErrors.comentarios}>
            <textarea value={cita.comentarios} onChange={updateCita("comentarios")} rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Cuéntanos qué te gustaría aprender de tu producto" />
          </Field>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-soft transition">
              <CheckCircle2 className="h-4 w-4" /> Agendar Mi Cita
            </button>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Atendemos en Las Tablas, Tonosí y Casa Matriz.
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}

const inputCls =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function FileField({
  label, accept, files, onChange,
}: { label: string; accept: string; files: File[]; onChange: (f: File[]) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <input type="file" accept={accept} multiple
          onChange={(e) => onChange(Array.from(e.target.files ?? []))}
          className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90" />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
          {files.map((f, i) => <li key={i}>• {f.name}</li>)}
        </ul>
      )}
    </label>
  );
}

function ModeCard({
  active, onClick, Icon, title, desc,
}: { active: boolean; onClick: () => void; Icon: any; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-xl border p-5 transition ${
        active ? "border-primary bg-primary-soft shadow-soft" : "border-border bg-card hover:border-primary/50"
      }`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function FeatureTile({ Icon, title, desc }: { Icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 p-4 hover:bg-primary-foreground/15 transition">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-display font-semibold text-sm">{title}</div>
      <div className="text-xs text-primary-foreground/80 mt-0.5">{desc}</div>
    </div>
  );
}
