import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, SlidersHorizontal, Loader2, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetailDialog, type ProductLite } from "@/components/site/ProductDetailDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildWaUrl } from "@/lib/whatsapp";
import { crearSolicitudBordado } from "@/lib/embroidery.functions";

const searchSchema = z.object({
  cat: z.string().optional(),
  brand: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Catálogo Completo · Cooperativa Gladys B. de Ducasa, R.L." },
      { name: "description", content: "Catálogo unificado: electrodomésticos, muebles y bordados personalizados. Busca por categoría o por nombre del producto." },
      { property: "og:title", content: "Catálogo Completo GBD" },
      { property: "og:description", content: "Todo nuestro catálogo en un solo lugar, con búsqueda por categoría y por nombre." },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: Catalogo,
});

function Catalogo() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Nuestro Catálogo</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Todo nuestro catálogo en un solo lugar. Busca por categoría o escribe el nombre del producto.
        </p>
      </header>

      <CatalogoCompleto />

      <div className="mt-16">
        <FormularioBordados />
      </div>
    </div>
  );
}

/* ---------- CATÁLOGO COMPLETO ---------- */
function CatalogoCompleto() {
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
      let qb = supabase
        .from("products")
        .select("id,category_id,name,brand,model,code,description,features,price_cash,price_financed,stock,images,datasheet_url,manual_url,is_featured,is_published,views_count,quote_count,created_at,updated_at, categories(slug,name)")
        .eq("is_published", true)
        .order("is_featured", { ascending: false });
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
      [p.name, p.brand, p.model, p.code, p.categories?.name].filter(Boolean).join(" ").toLowerCase().includes(needle)
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
        Object.keys(next).forEach((k) => { if (!next[k]) delete next[k]; });
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
            placeholder="Buscar por nombre..."
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
            <h3 className="font-display font-semibold text-lg">No encontramos productos con esa búsqueda</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Prueba con otra categoría o escríbenos por WhatsApp y te asesoramos directamente.
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

/* ---------- FORMULARIO DE COTIZACIÓN ---------- */
const cotizacionSchema = z.object({
  name: z.string().trim().min(2, "Tu nombre").max(100),
  phone: z.string().trim().min(6, "Teléfono válido").max(30),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  address: z.string().trim().min(3, "Indica tu dirección").max(300),
  description: z.string().trim().min(5, "Describe tu pedido").max(2000),
});
type CotizacionVals = z.infer<typeof cotizacionSchema>;

function FormularioBordados() {
  const [submitting, setSubmitting] = useState(false);
  const crearBordado = useServerFn(crearSolicitudBordado);
  const { register, handleSubmit, formState: { errors } } = useForm<CotizacionVals>({
    resolver: zodResolver(cotizacionSchema),
  });

  const onSubmit = async (vals: CotizacionVals) => {
    setSubmitting(true);
    try {
      await crearBordado({ data: {
        name: vals.name,
        phone: vals.phone,
        email: vals.email || "",
        service_type: "Solicitud de cotización",
        quantity: 1,
        placement: vals.address,
        notes: vals.description,
        consent: true,
      } as any });
      toast.success("Solicitud enviada. Te contactaremos por WhatsApp.");

      const msg = [
        "Hola, quiero solicitar una cotización:",
        `Nombre: ${vals.name}`,
        `Tel: ${vals.phone}`,
        vals.email ? `Correo: ${vals.email}` : null,
        `Dirección: ${vals.address}`,
        `Pedido: ${vals.description}`,
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
        <Field label="Dirección" error={errors.address?.message}>
          <Input {...register("address")} placeholder="Provincia, distrito, barrio..." />
        </Field>
        <Field label="Descripción del pedido" error={errors.description?.message} className="sm:col-span-2">
          <Textarea {...register("description")} rows={4} placeholder="Cuéntanos qué necesitas: productos, cantidades, colores, fechas..." />
        </Field>

        <Button type="submit" disabled={submitting} className="sm:col-span-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" size="lg">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
          Solicitar Cotización por WhatsApp
        </Button>
      </form>
    </section>
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
