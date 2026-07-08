import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Mail, MapPin, Clock, Instagram, Globe, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { logLead } from "@/lib/whatsapp";
import { registerBitacora } from "@/lib/bitacora.functions";
import { DataConsent } from "@/components/site/DataConsent";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Cotiza tu Línea Blanca o Bordados. Las Tablas: +507 6784-1941 · Tonosí: +507 6871-1242 · Bordados: +507 6829-8538." },
      { property: "og:title", content: "Contacto · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "WhatsApp directo y formulario de cotización." },
    ],
    links: [{ rel: "canonical", href: "/contacto" }],
  }),
  component: Contacto,
});

const WA_LAS_TABLAS = "50767841941";
const WA_TONOSI = "50768711242";
const WA_BORDADOS = "50768298538";

const PRODUCT_CATEGORIES = [
  "Refrigeradoras", "Estufas / Cocinas", "Lavadoras y Secadoras", "Aires Acondicionados",
  "Televisores", "Audio y Video", "Microondas", "Pequeños Electrodomésticos",
  "Salas / Muebles", "Comedores", "Recámaras", "Colchones",
  "Tecnología / Cómputo", "Motos y Bicicletas", "Otros",
];

const PRICE_RANGES = [
  "Menos de B/. 200",
  "B/. 200 – B/. 500",
  "B/. 500 – B/. 1,000",
  "B/. 1,000 – B/. 2,000",
  "B/. 2,000 – B/. 5,000",
  "Más de B/. 5,000",
];

const quoteSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(120),
  id_doc: z.string().trim().min(4, "Cédula o pasaporte requerido").max(40),
  phone: z.string().trim().min(6, "Teléfono válido").max(30),
  email: z.string().trim().email("Correo inválido").max(255),
  branch: z.enum(["las-tablas", "tonosi"], { message: "Selecciona la sucursal" }),
  notes: z.string().max(1500).optional().or(z.literal("")),
  items: z.array(z.object({
    category: z.string().min(1, "Categoría requerida"),
    price_range: z.string().min(1, "Selecciona rango"),
    details: z.string().min(2, "Describe el producto").max(500),
  })).min(1, "Agrega al menos un producto"),
});
type QuoteVals = z.infer<typeof quoteSchema>;

function Contacto() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-5xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold">Hablemos</h1>
      <p className="mt-3 text-muted-foreground">Te respondemos por WhatsApp de inmediato. Elige el canal o completa el formulario de cotización.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <ChannelCard title="Línea Blanca · Las Tablas" phone="+507 6784-1941" href={`https://wa.me/${WA_LAS_TABLAS}`} />
        <ChannelCard title="Línea Blanca · Tonosí" phone="+507 6871-1242" href={`https://wa.me/${WA_TONOSI}`} />
        <ChannelCard title="Bordados" phone="+507 6829-8538" href={`https://wa.me/${WA_BORDADOS}`} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Info Icon={Mail} title="Email">lineablanca@coopgbd.com</Info>
        <Info Icon={MapPin} title="Ubicación">Las Tablas y Tonosí · Los Santos, Panamá</Info>
        <Info Icon={Clock} title="Horario">Lun–Sáb · 8:00 AM a 5:00 PM</Info>
        <Info Icon={Globe} title="Web"><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">coopgbd.com</a></Info>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <Instagram className="h-4 w-4 text-primary" />
        <a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="text-primary hover:underline">@gbdmuebleria</a>
      </div>

      <QuoteForm />
    </div>
  );
}

function QuoteForm() {
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const register = useServerFn(registerBitacora);
  const { register: rhfRegister, control, handleSubmit, formState: { errors } } = useForm<QuoteVals>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      branch: "las-tablas",
      items: [{ category: "", price_range: "", details: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (vals: QuoteVals) => {
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    setSubmitting(true);
    try {
      const targetPhone = vals.branch === "tonosi" ? WA_TONOSI : WA_LAS_TABLAS;
      const branchLabel = vals.branch === "tonosi" ? "Tonosí" : "Las Tablas";

      const lines = [
        "*Cotización · Línea Blanca GBD*",
        `Sucursal: ${branchLabel}`,
        "",
        `Nombre: ${vals.name}`,
        `Cédula / Pasaporte: ${vals.id_doc}`,
        `Teléfono: ${vals.phone}`,
        `Correo: ${vals.email}`,
        "",
        "*Productos solicitados:*",
        ...vals.items.map((it, i) =>
          `${i + 1}. ${it.category} — ${it.price_range}\n   ${it.details}`
        ),
      ];
      if (vals.notes) lines.push("", `Notas: ${vals.notes}`);
      if (files.length) lines.push("", `_Adjuntaré ${files.length} foto(s) por este chat._`);

      const msg = lines.join("\n");

      try {
        await register({ data: {
          cliente_nombre: vals.name,
          cliente_telefono: vals.phone,
          cliente_email: vals.email,
          producto_servicio: vals.items.map(i => `${i.category}: ${i.details}`).join(" | "),
          categoria: "linea-blanca",
          origen: "contacto",
          observaciones: vals.notes || null,
          meta: { branch: branchLabel, id_doc: vals.id_doc, items: vals.items },
          consent: true,
        } as any });
      } catch (e) { console.warn(e); }
      await logLead({ channel: "linea-blanca", customer_name: vals.name });

      const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      toast.success("Abriendo WhatsApp para enviar tu cotización.");
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo enviar. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="cotizar" className="mt-14 rounded-3xl border border-border bg-card p-6 lg:p-10 shadow-soft">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Cotización Línea Blanca</span>
        <h2 className="mt-2 font-display text-2xl lg:text-3xl font-bold">Solicita tu cotización personalizada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Completa tus datos y agrega uno o varios productos. Te responderemos por WhatsApp desde la sucursal que elijas.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" error={errors.name?.message}>
            <Input {...rhfRegister("name")} placeholder="Tu nombre" />
          </Field>
          <Field label="Cédula o Pasaporte" error={errors.id_doc?.message}>
            <Input {...rhfRegister("id_doc")} placeholder="8-123-456 / AB123456" />
          </Field>
          <Field label="Teléfono de contacto" error={errors.phone?.message}>
            <Input {...rhfRegister("phone")} placeholder="+507 ..." />
          </Field>
          <Field label="Correo electrónico" error={errors.email?.message}>
            <Input type="email" {...rhfRegister("email")} placeholder="tu@correo.com" />
          </Field>
          <Field label="Sucursal de atención" error={errors.branch?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="branch"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: "las-tablas", label: "Las Tablas", phone: "+507 6784-1941" },
                    { v: "tonosi", label: "Tonosí", phone: "+507 6871-1242" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => field.onChange(opt.v)}
                      className={`text-left rounded-xl border-2 px-4 py-3 transition ${
                        field.value === opt.v
                          ? "border-primary bg-primary-soft"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="font-display font-bold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">WhatsApp {opt.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Productos a cotizar
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ category: "", price_range: "", details: "" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Agregar producto
            </Button>
          </div>

          <div className="mt-3 space-y-4">
            {fields.map((f, idx) => (
              <div key={f.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Producto #{idx + 1}</div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Categoría" error={errors.items?.[idx]?.category?.message}>
                    <select
                      {...rhfRegister(`items.${idx}.category` as const)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Selecciona...</option>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Rango de precio (B/.)" error={errors.items?.[idx]?.price_range?.message}>
                    <select
                      {...rhfRegister(`items.${idx}.price_range` as const)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Selecciona...</option>
                      {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Detalles del producto" error={errors.items?.[idx]?.details?.message} className="sm:col-span-2">
                    <Textarea
                      {...rhfRegister(`items.${idx}.details` as const)}
                      rows={2}
                      placeholder="Marca, modelo, color, capacidad, características deseadas..."
                    />
                  </Field>
                </div>
              </div>
            ))}
            {errors.items?.root && (
              <div className="text-xs text-destructive">{errors.items.root.message}</div>
            )}
          </div>
        </div>

        <Field label="Notas adicionales (opcional)">
          <Textarea {...rhfRegister("notes")} rows={3} placeholder="Forma de pago preferida, plazo, urgencia, dirección de entrega..." />
        </Field>

        {/* Photos */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fotos de referencia (opcional)
          </Label>
          <div className="mt-2 flex items-start gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary">
              <Upload className="h-4 w-4" />
              Seleccionar imágenes
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
              />
            </label>
            <div className="text-xs text-muted-foreground">
              {files.length === 0
                ? "Hasta 6 imágenes. Al enviar te abriremos WhatsApp para adjuntarlas en el chat."
                : `${files.length} archivo(s) listo(s) para enviar por WhatsApp después.`}
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full bg-background border border-border px-3 py-1 text-xs">
                  <span className="max-w-[160px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
          Enviar cotización por WhatsApp
        </Button>
      </form>
    </section>
  );
}

function ChannelCard({ title, phone, href }: { title: string; phone: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-6 hover:shadow-elevated hover:border-primary transition group">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground"><MessageCircle className="h-6 w-6" /></div>
      <div className="mt-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      <div className="mt-1 font-display text-xl font-bold">{phone}</div>
      <div className="mt-3 text-sm text-primary font-semibold group-hover:underline">Abrir chat →</div>
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

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </div>
  );
}
