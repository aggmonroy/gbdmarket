import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ShieldCheck, Phone, MessageCircle, Upload, AlertCircle, Headphones, PhoneCall } from "lucide-react";
import { WHATSAPP_LINEA_BLANCA } from "@/lib/whatsapp";

export const Route = createFileRoute("/garantias")({
  head: () => ({
    meta: [
      { title: "Reporte de Garantías y Servicio Post-Venta · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Reporta una garantía o solicita servicio técnico post-venta. Contacta directo con la marca o recibe apoyo de uno de nuestros agentes." },
      { property: "og:title", content: "Garantías y Servicio Post-Venta" },
      { property: "og:description", content: "Reporta una garantía o solicita servicio técnico post-venta." },
      { property: "og:url", content: "/garantias" },
    ],
    links: [{ rel: "canonical", href: "/garantias" }],
  }),
  component: Garantias,
});

type Mode = "directo" | "agente";

const BRAND_CALL_CENTERS: { brand: string; phone: string; note?: string }[] = [
  { brand: "LG", phone: "800-0552", note: "Servicio al cliente Panamá" },
  { brand: "Samsung", phone: "800-7267", note: "Soporte técnico Panamá" },
  { brand: "Whirlpool", phone: "800-0541" },
  { brand: "Mabe", phone: "800-2223" },
  { brand: "Frigidaire / Electrolux", phone: "800-3503" },
  { brand: "Haier / Hisense", phone: "800-4427" },
  { brand: "Oster / Black+Decker", phone: "800-0682" },
];

const formSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa tu nombre completo").max(120),
  cedula: z.string().trim().min(4, "Ingresa tu cédula").max(40),
  fechaCompra: z.string().min(1, "Ingresa la fecha de compra"),
  factura: z.string().trim().min(1, "Ingresa el número de factura").max(60),
  modelo: z.string().trim().min(1, "Ingresa el modelo del artículo").max(120),
  serie: z.string().trim().min(1, "Ingresa el número de serie").max(120),
  telefono: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  marca: z.string().trim().max(80).optional().or(z.literal("")),
  descripcion: z.string().trim().min(15, "Describe el daño con más detalle (mín. 15 caracteres)").max(1500),
});

type FormData = z.infer<typeof formSchema>;

function Garantias() {
  const [mode, setMode] = useState<Mode>("agente");
  const [form, setForm] = useState<FormData>({
    nombre: "", cedula: "", fechaCompra: "", factura: "", modelo: "", serie: "", telefono: "", marca: "", descripcion: "",
  });
  const [files, setFiles] = useState<{ fotos: File[]; videos: File[] }>({ fotos: [], videos: [] });
  const [extraDirecto, setExtraDirecto] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const update = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const waMessage = useMemo(() => {
    return [
      "*Reporte de Garantía / Servicio Post-Venta*",
      "",
      `• Nombre: ${form.nombre || "—"}`,
      `• Cédula: ${form.cedula || "—"}`,
      `• Teléfono: ${form.telefono || "—"}`,
      `• Fecha de compra: ${form.fechaCompra || "—"}`,
      `• N° de factura: ${form.factura || "—"}`,
      `• Marca: ${form.marca || "—"}`,
      `• Modelo: ${form.modelo || "—"}`,
      `• N° de serie: ${form.serie || "—"}`,
      "",
      "*Descripción del daño:*",
      form.descripcion || "—",
      "",
      `Adjuntaré ${files.fotos.length} foto(s) y ${files.videos.length} video(s) en este chat.`,
    ].join("\n");
  }, [form, files]);

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
      return;
    }
    setErrors({});
    const url = `https://wa.me/${WHATSAPP_LINEA_BLANCA}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 max-w-5xl">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Garantías y servicio post-venta</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Reporta cualquier falla cubierta por garantía. Puedes contactar directamente con la marca o
            recibir apoyo de uno de nuestros agentes.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ModeCard active={mode === "directo"} onClick={() => setMode("directo")} Icon={PhoneCall}
          title="Contacto directo con la marca"
          desc="Llama al call center oficial del fabricante." />
        <ModeCard active={mode === "agente"} onClick={() => setMode("agente")} Icon={Headphones}
          title="Apoyo de un agente"
          desc="Te ayudamos a gestionar la garantía vía WhatsApp." />
      </div>

      {mode === "directo" ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Call centers de proveedores
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comunícate directamente con el servicio técnico oficial de la marca de tu equipo.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {BRAND_CALL_CENTERS.map((b) => (
              <a key={b.brand} href={`tel:${b.phone.replace(/\D/g, "")}`}
                className="rounded-xl border border-border p-4 hover:border-primary hover:shadow-soft transition flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold">{b.brand}</div>
                  <div className="text-sm text-primary font-medium">{b.phone}</div>
                  {b.note && <div className="text-xs text-muted-foreground">{b.note}</div>}
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-border p-4">
            <label className="text-sm font-semibold flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" /> ¿Tienes un número directo de servicio técnico?
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Anótalo aquí para tu referencia o compártelo con nosotros para incluirlo en este listado.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={extraDirecto}
                onChange={(e) => setExtraDirecto(e.target.value)}
                placeholder="Ej: Marca XYZ — 800-0000"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <a
                href={`https://wa.me/${WHATSAPP_LINEA_BLANCA}?text=${encodeURIComponent(
                  `Hola, quiero compartir un número directo de servicio técnico: ${extraDirecto || "(escribir aquí)"}`,
                )}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-whatsapp px-4 py-2 text-sm font-semibold text-whatsapp-foreground hover:bg-whatsapp/90"
              >
                <MessageCircle className="h-4 w-4" /> Enviar
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Ten a mano tu factura, modelo y número de serie. Si prefieres que un agente nuestro gestione el reporte,
              cambia a <button type="button" onClick={() => setMode("agente")} className="text-primary font-semibold hover:underline">Apoyo de un agente</button>.
            </span>
          </div>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold">Datos del reporte</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Completa la información. Al enviar se abrirá WhatsApp con todos los datos. Allí podrás adjuntar fotos y videos del daño.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" error={errors.nombre}>
              <input value={form.nombre} onChange={update("nombre")} className={inputCls} placeholder="Juan Pérez" />
            </Field>
            <Field label="Número de cédula" error={errors.cedula}>
              <input value={form.cedula} onChange={update("cedula")} className={inputCls} placeholder="8-123-456" />
            </Field>
            <Field label="Teléfono de contacto" error={errors.telefono}>
              <input type="tel" value={form.telefono} onChange={update("telefono")} className={inputCls} placeholder="+507 6000-0000" />
            </Field>
            <Field label="Fecha de compra" error={errors.fechaCompra}>
              <input type="date" value={form.fechaCompra} onChange={update("fechaCompra")} className={inputCls} />
            </Field>
            <Field label="Número de factura" error={errors.factura}>
              <input value={form.factura} onChange={update("factura")} className={inputCls} placeholder="F-00001234" />
            </Field>
            <Field label="Marca (opcional)" error={errors.marca}>
              <input value={form.marca} onChange={update("marca")} className={inputCls} placeholder="LG, Samsung, Mabe…" />
            </Field>
            <Field label="Modelo del artículo" error={errors.modelo}>
              <input value={form.modelo} onChange={update("modelo")} className={inputCls} placeholder="Ej: GR-B252SQB" />
            </Field>
            <Field label="Número de serie" error={errors.serie}>
              <input value={form.serie} onChange={update("serie")} className={inputCls} placeholder="SN-XXXXXXXX" />
            </Field>
          </div>

          <Field label="Descripción completa del daño" error={errors.descripcion}>
            <textarea value={form.descripcion} onChange={update("descripcion")} rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe la falla: cuándo empezó, qué sucede, ruidos, mensajes de error, etc." />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              label="Fotos del equipo / daño"
              accept="image/*"
              files={files.fotos}
              onChange={(fs) => setFiles((p) => ({ ...p, fotos: fs }))}
            />
            <FileField
              label="Videos (opcional)"
              accept="video/*"
              files={files.videos}
              onChange={(fs) => setFiles((p) => ({ ...p, videos: fs }))}
            />
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
            <button type="button" onClick={() => setMode("directo")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent">
              Prefiero contactar a la marca directamente
            </button>
          </div>
        </form>
      )}
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
        <input
          type="file" accept={accept} multiple
          onChange={(e) => onChange(Array.from(e.target.files ?? []))}
          className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90"
        />
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
