import { Package, MessageCircle, ShoppingCart } from "lucide-react";
import { DisponibilidadBadge } from "./DisponibilidadBadge";
import type { ProductLite } from "./ProductDetailDialog";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";


export function ProductCard({ product, onClick }: { product: ProductLite & { category?: string | null }; onClick: () => void }) {
  const { add, setAbierto } = useCart();

  const agregar = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    add({
      id: product.id,
      name: product.name,
      brand: product.brand ?? null,
      model: product.model ?? null,
      code: product.code ?? null,
      image: product.images?.[0] ?? null,
      disponibilidad: product.disponibilidad ?? null,
    });
    toast.success("Agregado al carrito de cotización");
    setAbierto(true);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:shadow-elevated hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="aspect-square bg-muted overflow-hidden relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-12 w-12" /></div>
        )}
      </div>
      <div className="p-4">
        {product.brand && <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{product.brand}</div>}
        <div className="mt-0.5 font-display font-semibold text-foreground line-clamp-2">{product.name}</div>
        {product.model && <div className="text-xs text-muted-foreground mt-0.5">Modelo {product.model}</div>}
        <div className="mt-2">
          <DisponibilidadBadge disponibilidad={product.disponibilidad} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
            <MessageCircle className="h-3.5 w-3.5" /> Ver detalle
          </span>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={agregar}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
