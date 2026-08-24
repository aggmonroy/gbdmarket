import { toast } from "sonner";

/** Construye el enlace público y compartible de un artículo del catálogo. */
export function enlaceProducto(id: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/catalogo?p=${encodeURIComponent(id)}`;
}

/** Comparte el enlace de un artículo (share nativo en móvil, copiar en escritorio). */
export async function compartirProducto(p: { id: string; name: string; brand?: string | null; model?: string | null }) {
  const url = enlaceProducto(p.id);
  const titulo = [p.name, p.brand, p.model].filter(Boolean).join(" · ");
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: titulo, text: `Mira este artículo: ${titulo}`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Enlace del artículo copiado");
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    toast.error("No se pudo compartir el enlace");
  }
}
