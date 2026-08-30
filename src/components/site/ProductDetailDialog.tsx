import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logLead } from "@/lib/whatsapp";
import { crearPreorden } from "@/lib/pedidos.functions";
import { useServerFn } from "@tanstack/react-start";
import { DataConsent } from "@/components/site/DataConsent";
import { toast } from "sonner";
import { FileText, MessageCircle, Package, Scissors, Share2, ShoppingCart } from "lucide-react";
import { compartirProducto } from "@/lib/compartir";
import { useCart } from "@/lib/cart";
import { useSocioActivo } from "@/lib/socio";
import { SocioProductoDialog } from "./SocioProductoDialog";
import { DisponibilidadBadge } from "./DisponibilidadBadge";
import { ProductGallery } from "./ProductGallery";


export type ProductLite = {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  code?: string | null;
  description?: string | null;
  features?: string[] | null;
  price_cash?: number | null;
  stock?: number | null;
  disponibilidad?: string | null;

  images: string[];
  datasheet_url?: string | null;
};

export function ProductDetailDialog({
  open, onOpenChange, product, esBordado = false, onSolicitarBordado,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  product: ProductLite | null;
  esBordado?: boolean;
  onSolicitarBordado?: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const crear = useServerFn(crearPreorden);
  const { add, setAbierto } = useCart();
  const socio = useSocioActivo();
  const [socioForm, setSocioForm] = useState(false);
  if (!product) return null;


  const agregarAlCarrito = () => {
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
    onOpenChange(false);
    setAbierto(true);
  };

  const sendWa = async () => {
    if (!customerName.trim()) { toast.error("Ingresa tu nombre"); return; }
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    try {
      const r: any = await crear({ data: {
        cliente_nombre: customerName,
        cliente_telefono: phone,
        origen: "catalogo",
        canal: "linea-blanca",
        categoria: "linea-blanca",
        observaciones: notes,
        items: [{
          cantidad: 1,
          descripcion: `${product.name}${product.brand ? " · " + product.brand : ""}${product.model ? " " + product.model : ""}`,
          detalle: product.code ? `Código: ${product.code}` : "",
        }],
        meta: { product_id: product.id, code: product.code ?? null },
        consent: true,
      } as any });
      logLead({
        channel: "linea-blanca",
        product_id: product.id,
        product_name: product.name,
        customer_name: customerName || null,
      });
      onOpenChange(false);
      window.location.href = `/pedido/${r.numero_pedido}?t=${encodeURIComponent(r.token)}`;
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo generar la pre-orden. Intenta nuevamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <ProductGallery images={product.images ?? []} alt={product.name} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.brand && <span className="rounded-full bg-primary-soft px-2 py-1 font-medium text-primary">{product.brand}</span>}
              {product.model && <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">Modelo {product.model}</span>}
              {product.code && <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">Código {product.code}</span>}
            </div>

            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => void compartirProducto(product)}>
                <Share2 className="mr-2 h-4 w-4" /> Compartir enlace del artículo
              </Button>
            </div>

            {!esBordado && (
              <div className="mt-3">
                <DisponibilidadBadge disponibilidad={product.disponibilidad} size="md" />
              </div>
            )}



            {product.description && <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{product.description}</p>}

            {product.features && product.features.length > 0 && (
              <ul className="mt-4 grid gap-1.5 text-sm">
                {product.features.map((f, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{f}</li>
                ))}
              </ul>
            )}

            {esBordado ? (
              <div className="mt-6 rounded-xl border border-border bg-primary-soft/40 p-4">
                <div className="text-sm font-semibold text-primary">Pedido de bordado</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Los artículos de bordado se cotizan con el formulario de pedido de bordados, según el diseño, la cantidad
                  y la ubicación del bordado.
                </p>
                <Button
                  onClick={() => { onOpenChange(false); onSolicitarBordado?.(); }}
                  className="mt-3 w-full"
                  size="lg"
                >
                  <Scissors className="mr-2 h-4 w-4" /> Solicitar pedido de bordado
                </Button>
                {product.datasheet_url && (
                  <a
                    href={product.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" /> Descargar ficha técnica (PDF)
                  </a>
                )}
              </div>
            ) : (
              <>
                <Button onClick={agregarAlCarrito} className="mt-6 w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Solicitar cotización
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Puedes sumar varios artículos y solicitar una sola cotización al final. Solo necesitamos tu nombre y un
                  número de WhatsApp válido.
                </p>

                {product.datasheet_url && (
                  <a
                    href={product.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" /> Descargar ficha técnica (PDF)
                  </a>
                )}
              </>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
