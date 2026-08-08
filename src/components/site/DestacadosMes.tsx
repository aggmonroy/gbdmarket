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

/**
 * Selección basada en tendencias de mercado de línea blanca y mueblería
 * (se usa cuando el catálogo aún no tiene productos destacados publicados).
 */
const CURADOS: Destacado[] = [
  {
    name: "Refrigeradora No Frost Inverter",
    brand: "Línea Blanca",
    image_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=900&q=80",
    nota: "La más buscada del mes: ahorro de energía",
    search: { q: "refrigeradora" },
  },
  {
    name: "Lavadora automática de carga superior",
    brand: "Línea Blanca",
    image_url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=900&q=80",
    nota: "Tendencia en hogares familiares",
    search: { q: "lavadora" },
  },
  {
    name: "Juego de sala 3-2-1 en tela",
    brand: "Mueblería",
    image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    nota: "Favorito para renovar la sala",
    search: { q: "sala" },
  },
  {
    name: "Smart TV 55\" 4K",
    brand: "Tecnología",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80",
    nota: "Alta demanda en entretenimiento",
    search: { q: "televisor" },
  },
  {
    name: "Aire acondicionado Inverter 12,000 BTU",
    brand: "Climatización",
    image_url: "https://images.unsplash.com/photo-1631545308456-511dcbf8f97b?auto=format&fit=crop&w=900&q=80",
    nota: "Top de temporada por el clima",
    search: { q: "aire" },
  },
];

export function DestacadosMes() {
  const { data } = useQuery({
    queryKey: ["home-destacados-mes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,brand,images,is_featured,views_count,categories(slug)")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("views_count", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const deDb: Destacado[] = (data ?? [])
    .filter((p) => (p as any).categories?.slug !== "bordados")
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      brand: p.brand,
      image_url: p.images?.[0] ?? null,
      nota: "Destacado del mes",
      search: { q: p.name },
    }));

  const items = deDb.length >= 5 ? deDb : CURADOS;

  return (
    <section className="container mx-auto px-4 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Selección del mes
        </span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Productos destacados del mes</h2>
        <p className="mt-3 text-muted-foreground">
          Los artículos con mayor demanda según las tendencias del mercado.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
