import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Search, SlidersHorizontal, Shirt, Crown, Briefcase, Backpack,
  BadgeCheck, Upload, Loader2, MessageCircle, Package, Scissors,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetailDialog, type ProductLite } from "@/components/site/ProductDetailDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildWaUrl, logLead } from "@/lib/whatsapp";

const searchSchema = z.object({
  tab: z.enum(["linea-blanca", "bordados"]).optional(),
  cat: z.string().optional(),
  brand: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Catálogo · Línea Blanca y Bordados · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Catálogo unificado: electrodomésticos, muebles y bordados personalizados con financiamiento cooperativo en Panamá." },
      { property: "og:title", content: "Catálogo · Línea Blanca y Bordados GBD" },
      { property: "og:description", content: "Todo nuestro catálogo en un solo lugar." },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: Catalogo,
});

function Catalogo() {
  const { tab = "linea-blanca" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = tab;

  const setTab = (t: "linea-blanca" | "bordados") =>
    navigate({ search: (prev: any) => ({ ...prev, tab: t }) });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Nuestro Catálogo</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Explora nuestra Línea Blanca y servicios de Bordado Personalizado en un solo lugar.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-8 inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
        <button
          onClick={() => setTab("linea-blanca")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "linea-blanca"
              ? "bg-primary text-primary-foreground shadow"
              : "text-foreground/70 hover:text-primary"
          }`}
        >
          <Package className="h-4 w-4" /> Línea Blanca
        </button>
        <button
          onClick={() => setTab("bordados")}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "bordados"
              ? "bg-primary text-primary-foreground shadow"
              : "text-foreground/70 hover:text-primary"
          }`}
        >
          <Scissors className="h-4 w-4" /> Bordados
        </button>
      </div>

      {activeTab === "linea-blanca" ? <LineaBlancaPanel /> : <BordadosPanel />}
    </div>
  );
}

/* ---------- LÍNEA BLANCA PANEL ---------- */
function LineaBlancaPanel() {
  const { cat, brand, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [selected, setSelected] = useState<ProductLite | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", cat, brand],
    queryFn: async () => {
      let qb = supabase.from("products").select("id,category_id,name,brand,model,code,description,features,price_cash,price_financed,stock,images,datasheet_url,manual_url,is_featured,is_published,views_count,quote_count,created_at,updated_at, categories(slug,name)").eq("is_published", true).order("is_featured", { ascending: false });
      if (cat) {
        const catId = (await supabase.from("categories").select("id").eq("slug", cat).maybeSingle()).data?.id;
        if (catId) qb = qb.eq("category_id", catId);
      }
      if (brand) qb = qb.eq("brand", brand);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!q) return products;
    const needle = q.toLowerCase();
    return products.filter((p: any) =>
      [p.name, p.brand, p.model, p.code].filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [products, q]);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p: any) => p.brand).filter(Boolean))) as string[],
    [products]
  );

  const setSearch = (patch: Partial<{ cat: string; brand: string; q: string }>) => {
    navigate({
      search: (prev: any) => {
        const next: any = { ...prev, ...patch };
        Object.keys(next).forEach((k) => { if (!next[k] && k !== "tab") delete next[k]; });
        return next;
      },
    });
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      <aside className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={q ?? ""}
            onChange={(e) => setSearch({ q: e.target.value })}
            className="pl-9"
          />
        </div>

        <FilterGroup title="Categoría">
          <FilterChip active={!cat} onClick={() => setSearch({ cat: "" })}>Todas</FilterChip>
          {categories.map((c: any) => (
            <FilterChip key={c.id} active={cat === c.slug} onClick={() => setSearch({ cat: c.slug })}>
              {c.name}
            </FilterChip>
          ))}
        </FilterGroup>

        {brands.length > 0 && (
          <FilterGroup title="Marca">
            <FilterChip active={!brand} onClick={() => setSearch({ brand: "" })}>Todas</FilterChip>
            {brands.map((b) => (
              <FilterChip key={b} active={brand === b} onClick={() => setSearch({ brand: b })}>
                {b}
              </FilterChip>
            ))}
          </FilterGroup>
        )}
      </aside>

      <section>
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>
            <SlidersHorizontal className="inline h-3.5 w-3.5 mr-1" />
            {filtered.length} producto{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading && <div className="text-muted-foreground py-12 text-center">Cargando catálogo...</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <h3 className="font-display font-semibold text-lg">Aún no hay productos cargados en esta categoría</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Estamos cargando el inventario. Mientras tanto, escríbenos por WhatsApp y te asesoramos directamente.
            </p>
            <a
              href="https://wa.me/50767841941"
              target="_blank" rel="noreferrer"
              className="mt-5 inline-flex items-center rounded-md bg-whatsapp px-4 py-2 text-sm font-semibold text-whatsapp-foreground hover:opacity-90"
            >
              Escribir por WhatsApp
            </a>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p: any) => (
              <ProductCard key={p.id} product={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </section>

      <ProductDetailDialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)} product={selected} />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- BORDADOS PANEL ---------- */
const bordadoServices = [
  { Icon: Briefcase, title: "Bordado Corporativo", desc: "Logos institucionales con definición profesional." },
  { Icon: Shirt, title: "Uniformes Empresariales", desc: "Camisas, chompas y polos para tu equipo." },
  { Icon: BadgeCheck, title: "Camisas Polo", desc: "Bordado de logos en piezas individuales o por lote." },
  { Icon: Crown, title: "Gorras", desc: "Bordado frontal y lateral en distintos materiales." },
  { Icon: Shirt, title: "Toallas", desc: "Nombres, iniciales y monogramas." },
  { Icon: Backpack, title: "Mochilas", desc: "Personalización para colegios y empresas." },
];

const bordadoSchema = z.object({
  name: z.string().trim().min(2, "Tu nombre").max(100),
  phone: z.string().trim().min(6, "Teléfono válido").max(30),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  service_type: z.string().min(2).max(80),
  quantity: z.coerce.number().int().min(1).max(100000),
  colors: z.string().max(200).optional().or(z.literal("")),
  placement: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
type BordadoVals = z.infer<typeof bordadoSchema>;

function BordadosPanel() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BordadoVals>({
    resolver: zodResolver(bordadoSchema),
    defaultValues: { service_type: "Bordado Corporativo", quantity: 12 },
  });

  const onSubmit = async (vals: BordadoVals) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("embroidery_requests").insert({
        name: vals.name,
        phone: vals.phone,
        email: vals.email || null,
        service_type: vals.service_type,
        quantity: vals.quantity,
        colors: vals.colors || null,
        placement: vals.placement || null,
        notes: vals.notes || null,
      });
      if (error) throw error;
      await logLead({ channel: "bordados", customer_name: vals.name, product_name: vals.service_type });
      toast.success("Solicitud enviada. Te contactaremos por WhatsApp.");

      const msg = [
        "Hola, quiero cotizar un trabajo de bordado:",
        `Servicio: ${vals.service_type}`,
        `Cantidad: ${vals.quantity}`,
        vals.colors ? `Colores: ${vals.colors}` : null,
        vals.placement ? `Ubicación: ${vals.placement}` : null,
        vals.notes ? `Notas: ${vals.notes}` : null,
        `Nombre: ${vals.name}`,
        `Tel: ${vals.phone}`,
      ].filter(Boolean).join("\n");
      window.open(buildWaUrl("bordados", msg), "_blank");
    } catch (e: any) {
      toast.error("No se pudo enviar. Intenta nuevamente.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-2xl font-bold">Nuestros servicios de Bordado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalizamos prendas y artículos con acabados profesionales.
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {bordadoServices.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 hover:shadow-soft hover:border-primary/40 transition">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display font-semibold">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="cotizar" className="rounded-2xl border border-border bg-card p-6 lg:p-10 shadow-soft max-w-3xl mx-auto">
        <h2 className="font-display text-2xl font-bold">Solicita tu cotización</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Completa el formulario y recibirás respuesta por WhatsApp de inmediato.
        </p>

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
              {bordadoServices.map((s) => <option key={s.title}>{s.title}</option>)}
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
                Envíalo por WhatsApp al{" "}
                <a className="text-primary underline" href="https://wa.me/50768298538" target="_blank" rel="noreferrer">
                  +507 6829-8538
                </a>{" "}
                después de enviar este formulario.
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="sm:col-span-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" size="lg">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            Solicitar Cotización por WhatsApp
          </Button>
        </form>
      </section>
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
