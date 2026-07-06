import { Package, MessageCircle } from "lucide-react";
import type { ProductLite } from "./ProductDetailDialog";

export function ProductCard({ product, onClick }: { product: ProductLite & { category?: string | null }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
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
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Cotización sin compromiso</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
            <MessageCircle className="h-3.5 w-3.5" /> Cotizar
          </span>
        </div>
      </div>
    </button>
  );
}
