import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export type ProductoPublico = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  code: string | null;
  description: string | null;
  images: string[] | null;
};

/** Buscador del catálogo público para armar cotizaciones de El Progreso. */
export function ProgresoProductoPicker({
  open,
  onOpenChange,
  onElegir,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onElegir: (p: ProductoPublico) => void;
}) {
  const [q, setQ] = useState("");

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["progreso-catalogo", q],
    enabled: open,
    queryFn: async () => {
      let qb = supabase
        .from("products")
        .select("id,name,brand,model,code,description,images")
        .eq("is_published", true)
        .limit(60);
      if (q.trim()) qb = qb.or(`name.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%,code.ilike.%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return (data ?? []) as ProductoPublico[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display">Buscar en el catálogo</DialogTitle>
          <DialogDescription>Escoge los artículos que vas a cotizar.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, marca, modelo o código"
            className="pl-9"
          />
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!isLoading && !productos.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron artículos.</p>
          )}
          {productos.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onElegir(p);
                onOpenChange(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[p.brand, p.model && `Modelo ${p.model}`, p.code && `Código ${p.code}`].filter(Boolean).join(" · ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
