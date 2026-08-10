import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buscarProductosCotizacion } from "@/lib/productos-portal.functions";

export type ProductoCatalogo = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  code: string | null;
  description: string | null;
  images: string[] | null;
  price_cash: number | null;
  categoria: string | null;
  es_bordado: boolean;
};

/**
 * Buscador del catálogo para que el colaborador escoja los artículos que
 * añadirá a la cotización. Los artículos de bordados solo se ofrecen en las
 * cotizaciones internas (no en las que envía un cliente desde su carrito).
 */
export function ProductoPicker({
  open,
  onOpenChange,
  token,
  permitirBordados = false,
  onElegir,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  token: string;
  permitirBordados?: boolean;
  onElegir: (p: ProductoCatalogo) => void;
}) {
  const buscar = useServerFn(buscarProductosCotizacion);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cotizacion-catalogo", q, permitirBordados],
    queryFn: () => buscar({ data: { token, q, incluir_bordados: permitirBordados } }) as any,
    enabled: open,
  });

  const productos: ProductoCatalogo[] = data?.productos ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display">Buscar en el catálogo</DialogTitle>
          <DialogDescription>
            Escoge los artículos que quieres añadir a la cotización.
            {permitirBordados ? " Incluye artículos de bordados." : " Los artículos de bordados no aplican aquí."}
          </DialogDescription>
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
                  {[p.brand, p.model && `Modelo ${p.model}`, p.code && `Código ${p.code}`, p.categoria]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {p.description && <div className="truncate text-xs text-muted-foreground/80">{p.description}</div>}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
