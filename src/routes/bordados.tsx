import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Shirt, Crown, Briefcase, Backpack, BadgeCheck, Upload, Loader2, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { crearSolicitudBordado } from "@/lib/embroidery.functions";
import { crearPreorden } from "@/lib/pedidos.functions";
import { DataConsent } from "@/components/site/DataConsent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import heroB from "@/assets/hero-bordados.jpg";

export const Route = createFileRoute("/bordados")({
  head: () => ({
    meta: [
      { title: "Bordados Personalizados Panamá · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Bordado corporativo, uniformes empresariales, camisas polo, gorras, toallas y mochilas. Solicita tu cotización personalizada en Panamá." },
      { property: "og:title", content: "Bordados Personalizados · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "Bordado corporativo y personalización de prendas en Panamá." },
      { property: "og:url", content: "/bordados" },
    ],
    links: [{ rel: "canonical", href: "/bordados" }],
  }),
  component: Bordados,
});

const services = [
  { Icon: Briefcase, title: "Bordado Corporativo", desc: "Logos institucionales con definición profesional." },
  { Icon: Shirt, title: "Uniformes Empresariales", desc: "Camisas, chompas y polos para tu equipo." },
  { Icon: BadgeCheck, title: "Camisas Polo", desc: "Bordado de logos en piezas individuales o por lote." },
  { Icon: Crown, title: "Gorras", desc: "Bordado frontal y lateral en distintos materiales." },
  { Icon: Shirt, title: "Toallas", desc: "Nombres, iniciales y monogramas." },
  { Icon: Backpack, title: "Mochilas", desc: "Personalización para colegios y empresas." },
];

const schema = z.object({
  name: z.string().trim().min(2, "Tu nombre").max(100),
  phone: z.string().trim().min(6, "Teléfono válido").max(30),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  service_type: z.string().min(2).max(80),
  quantity: z.coerce.number().int().min(1).max(100000),
  colors: z.string().max(200).optional().or(z.literal("")),
  placement: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type FormVals = z.infer<typeof schema>;

function Bordados() {
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const crearPre = useServerFn(crearPreorden);
  const crearBordado = useServerFn(crearSolicitudBordado);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { service_type: "Bordado Corporativo", quantity: 12 },
  });

  const onSubmit = async (vals: FormVals) => {
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    setSubmitting(true);
    try {
      await crearBordado({ data: {
        name: vals.name,
        phone: vals.phone,
        email: vals.email || "",
        service_type: vals.service_type,
        quantity: vals.quantity,
        colors: vals.colors || "",
        placement: vals.placement || "",
        notes: vals.notes || "",
        consent: true,
        sin_tarea: true,
      } as any });
      const r: any = await crearPre({ data: {
        cliente_nombre: vals.name,
        cliente_telefono: vals.phone,
        cliente_email: vals.email || "",
        origen: "bordados",
        canal: "bordados",
        categoria: "bordados",
        observaciones: [vals.colors && `Colores: ${vals.colors}`, vals.placement && `Ubicación: ${vals.placement}`, vals.notes].filter(Boolean).join(" · "),
        items: [{ cantidad: vals.quantity, descripcion: vals.service_type, detalle: vals.placement || "" }],
        meta: { quantity: vals.quantity, colors: vals.colors, placement: vals.placement },
        consent: true,
      } as any });
      toast.success("Pre-orden generada. Revisa e imprime tu documento.");
      navigate({ to: "/pedido/$numero", params: { numero: r.numero_pedido } });
    } catch (e: any) {
      toast.error("No se pudo enviar. Intenta nuevamente.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <img src={heroB} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        <div className="container mx-auto relative px-4 lg:px-8 py-16 lg:py-20">
          <span className="inline-flex items-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Bordados Personalizados
          </span>
          <h1 className="mt-4 font-display text-4xl lg:text-5xl font-bold max-w-2xl">Tu marca bordada con precisión profesional.</h1>
          <p className="mt-4 text-primary-foreground/85 max-w-2xl">
            Atendemos empresas, colegios, equipos deportivos y clientes particulares en Panamá. Carga tu diseño y recibe una cotización en horas.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-14">
        <h2 className="font-display text-2xl font-bold">Nuestros servicios</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 hover:shadow-soft transition">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
              <div className="mt-4 font-display font-semibold">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="cotizar" className="container mx-auto px-4 lg:px-8 pb-20">
        <div className="rounded-2xl border border-border bg-card p-6 lg:p-10 shadow-soft max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold">Solicita tu cotización</h2>
          <p className="text-sm text-muted-foreground mt-1">Completa el formulario y recibirás respuesta por WhatsApp de inmediato.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Tu nombre o empresa" />
            </Field>
            <Field label="WhatsApp" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="+507 ..." />
            </Field>
            <Field label="Email (opcional)" error={errors.email?.message}>
              <Input type="email" {...register("email")} placeholder="tu@correo.com" />
            </Field>
            <Field label="Tipo de servicio" error={errors.service_type?.message}>
              <select {...register("service_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {services.map((s) => <option key={s.title}>{s.title}</option>)}
                <option>Personalización de Artículos</option>
              </select>
            </Field>
            <Field label="Cantidad" error={errors.quantity?.message}>
              <Input type="number" min={1} {...register("quantity")} />
            </Field>
            <Field label="Colores deseados" error={errors.colors?.message}>
              <Input {...register("colors")} placeholder="Ej: azul, blanco, dorado" />
            </Field>
            <Field label="Ubicación del bordado" error={errors.placement?.message} className="sm:col-span-2">
              <Input {...register("placement")} placeholder="Ej: pecho izquierdo, gorra frontal, espalda" />
            </Field>
            <Field label="Notas adicionales" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea {...register("notes")} rows={3} placeholder="Detalles del diseño, urgencia, etc." />
            </Field>

            <div className="sm:col-span-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm flex items-start gap-3">
              <Upload className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="font-medium">¿Tienes el diseño listo?</div>
                <div className="text-muted-foreground">
                  Envíalo directamente por WhatsApp al <a className="text-primary underline" href="https://wa.me/50768298538" target="_blank" rel="noreferrer">+507 6829-8538</a> después de enviar este formulario.
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <DataConsent accepted={consent} onChange={setConsent} id="bordados-consent" />
            </div>
            <Button type="submit" disabled={submitting || !consent} className="sm:col-span-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" size="lg">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              Solicitar Cotización por WhatsApp
            </Button>
          </form>
        </div>
      </section>
    </>
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
