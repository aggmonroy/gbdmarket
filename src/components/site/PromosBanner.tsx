import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function periodoActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Día del año — usado para rotar las 6 tarjetas visibles cada día. */
function diaDelAnio() {
  const d = new Date();
  const inicio = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - inicio.getTime()) / 86400000);
}

/**
 * Promociones del mes dentro del banner de Mueblería:
 * 6 tarjetas tomadas de los 12 artículos en stock elegidos por el admin,
 * rotando el grupo visible de forma diaria.
 */
export function PromosBanner() {
  const { data } = useQuery({
    queryKey: ["home-promos-banner", periodoActual()],
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
      const elegibles = (prods.data ?? []).filter((p) => (p as any).categories?.slug !== "bordados");
      const ids = sel.data?.product_ids ?? [];
      if (ids.length > 0) {
        const orden = new Map(ids.map((id: string, i: number) => [id, i]));
        const escogidos = elegibles
          .filter((p) => orden.has(p.id))
          .sort((a, b) => orden.get(a.id)! - orden.get(b.id)!);
        if (escogidos.length > 0) return escogidos;
      }
      return elegibles;
    },
    staleTime: 30 * 60 * 1000,
  });

  const pool = (data ?? []).slice(0, 12);
  if (pool.length === 0) return null;

  const offset = (diaDelAnio() * 6) % pool.length;
  const visibles = Array.from({ length: Math.min(6, pool.length) }, (_, k) => pool[(offset + k) % pool.length]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
          <Sparkles className="h-3.5 w-3.5" /> Selección del mes
        </span>
        <span className="font-display text-sm font-bold uppercase tracking-wide text-white">
          Promociones del mes
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {visibles.map((p) => (
          <Link
            key={p.id}
            to="/catalogo"
            search={{ q: p.name } as any}
            className="group overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-amber-300 transition"
          >
            <div className="aspect-square overflow-hidden bg-slate-800">
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="grid h-full place-items-center text-white/50">
                  <Package className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="p-2">
              {p.brand && (
                <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {p.brand}
                </div>
              )}
              <div className="line-clamp-2 text-xs font-semibold text-white">{p.name}</div>
              <div className="mt-1 text-[10px] text-amber-300">Disponible para entrega inmediata</div>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white/70 group-hover:text-amber-200">
                Ver <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
