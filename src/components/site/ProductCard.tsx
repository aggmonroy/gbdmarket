import { Package } from "lucide-react";
import { fmtUSD } from "@/lib/financing";
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
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">Agotado</span>
        )}
      </div>
      <div className="p-4">
        {product.brand && <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{product.brand}</div>}
        <div className="mt-0.5 font-display font-semibold text-foreground line-clamp-2">{product.name}</div>
        {product.model && <div className="text-xs text-muted-foreground mt-0.5">Modelo {product.model}</div>}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Contado</div>
            <div className="font-display text-lg font-bold text-primary">{fmtUSD(product.price_cash)}</div>
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">Cotizar →</span>
        </div>
      </div>
    </button>
  );
}
