import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetailDialog, type ProductLite } from "@/components/site/ProductDetailDialog";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";

const searchSchema = z.object({
  cat: z.string().optional(),
  brand: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/linea-blanca")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Línea Blanca · Electrodomésticos en Panamá · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Catálogo de aires acondicionados, refrigeradoras, lavadoras, estufas y más. Marcas GPlus, Nisato, Hisense, Whirlpool, Samsung y Premier con financiamiento cooperativo." },
      { property: "og:title", content: "Catálogo de Línea Blanca · Cooperativa Gladys B. de Ducasa R.L." },
      { property: "og:description", content: "Electrodomésticos con financiamiento cooperativo en Las Tablas, Panamá." },
      { property: "og:url", content: "/linea-blanca" },
    ],
    links: [{ rel: "canonical", href: "/linea-blanca" }],
  }),
  component: LineaBlanca,
});

function LineaBlanca() {
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
      let qb = supabase.from("products").select("id,category_id,name,brand,model,code,description,features,price_cash,price_financed,stock,images,datasheet_url,manual_url,is_featured,is_published,views_count,quote_count,disponibilidad,created_at,updated_at, categories(slug,name)").eq("is_published", true).order("is_featured", { ascending: false });
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

  const brands = useMemo(() => Array.from(new Set(products.map((p: any) => p.brand).filter(Boolean))) as string[], [products]);

  const setSearch = (patch: Partial<{ cat: string; brand: string; q: string }>) => {
    navigate({ search: (prev: any) => {
      const next: any = { ...prev, ...patch };
      Object.keys(next).forEach((k) => { if (!next[k]) delete next[k]; });
      return next;
    }});
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Línea Blanca</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Marcas GPlus, Nisato, Hisense, Whirlpool, Samsung y Premier. Cotiza al instante por WhatsApp con financiamiento cooperativo de 3 a 36 meses.
        </p>
      </header>

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
              <FilterChip key={c.id} active={cat === c.slug} onClick={() => setSearch({ cat: c.slug })}>{c.name}</FilterChip>
            ))}
          </FilterGroup>

          {brands.length > 0 && (
            <FilterGroup title="Marca">
              <FilterChip active={!brand} onClick={() => setSearch({ brand: "" })}>Todas</FilterChip>
              {brands.map((b) => (
                <FilterChip key={b} active={brand === b} onClick={() => setSearch({ brand: b })}>{b}</FilterChip>
              ))}
            </FilterGroup>
          )}
        </aside>

        <section>
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <span><SlidersHorizontal className="inline h-3.5 w-3.5 mr-1" />{filtered.length} producto{filtered.length === 1 ? "" : "s"}</span>
          </div>

          {isLoading && <div className="text-muted-foreground py-12 text-center">Cargando catálogo...</div>}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <h3 className="font-display font-semibold text-lg">Aún no hay productos cargados en esta categoría</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Estamos cargando el inventario. Mientras tanto, escríbenos por WhatsApp y te asesoramos directamente.
              </p>
              <a href="https://wa.me/50767841941" target="_blank" rel="noreferrer"
                className="mt-5 inline-flex items-center rounded-md bg-whatsapp px-4 py-2 text-sm font-semibold text-whatsapp-foreground hover:opacity-90">
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
      </div>

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
    >{children}</button>
  );
}
