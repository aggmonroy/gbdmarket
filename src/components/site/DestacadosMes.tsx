import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Destacado = {
  name: string;
  brand: string | null;
  image_url: string | null;
  nota: string;
  search: Record<string, string>;
};

function periodoActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Promociones del mes: 12 artículos EN STOCK elegidos por el administrador
 * (la selección del mes siguiente se hace entre el 20 y el 30 de cada mes).
 * Si aún no hay selección guardada, se muestran artículos en stock del catálogo.
 */
export function DestacadosMes() {
  const { data } = useQuery({
    queryKey: ["home-promos-mes", periodoActual()],
    queryFn: async () => {
      const periodo = periodoActual();
      const [sel, prods] = await Promise.all([
        supabase.from("promociones_mes").select("product_ids").eq("periodo", periodo).maybeSingle(),
        supabase
          .from("products")
          .select("id,name,brand,images,disponibilidad,categories(slug)")
          .eq("is_published", true)
          .eq("disponibilidad", "en_stock")
          .limit(200),
      ]);
      const elegibles = (prods.data ?? []).filter(
        (p) => (p as any).categories?.slug !== "bordados",
      );
      const ids = sel.data?.product_ids ?? [];
      if (ids.length > 0) {
        const orden = new Map(ids.map((id: string, i: number) => [id, i]));
        const escogidos = elegibles
          .filter((p) => orden.has(p.id))
          .sort((a, b) => (orden.get(a.id)! - orden.get(b.id)!));
        if (escogidos.length > 0) return escogidos;
      }
      return elegibles;
    },
    staleTime: 30 * 60 * 1000,
  });

  const items: Destacado[] = (data ?? []).slice(0, 12).map((p) => ({
    name: p.name,
    brand: p.brand,
    image_url: p.images?.[0] ?? null,
    nota: p.disponibilidad === "en_stock" ? "Disponible para entrega inmediata" : "Compra bajo pedido",
    search: { q: p.name },
  }));

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Selección del mes
        </span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">PROMOCIONES DEL MES</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <Link
            key={it.name}
            to="/catalogo"
            search={it.search as any}
            className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            <div className="aspect-square bg-muted overflow-hidden">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  alt={it.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-10 w-10" /></div>
              )}
            </div>
            <div className="p-4">
              {it.brand && (
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{it.brand}</div>
              )}
              <div className="mt-0.5 font-display font-semibold line-clamp-2">{it.name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.nota}</div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                Ver en catálogo <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
