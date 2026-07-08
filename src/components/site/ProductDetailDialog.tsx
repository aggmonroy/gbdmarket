import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildWaUrl, logLead } from "@/lib/whatsapp";
import { registerBitacora } from "@/lib/bitacora.functions";
import { useServerFn } from "@tanstack/react-start";
import { DataConsent } from "@/components/site/DataConsent";
import { toast } from "sonner";
import { FileText, MessageCircle, Package } from "lucide-react";

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
  images: string[];
  datasheet_url?: string | null;
};

export function ProductDetailDialog({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (b: boolean) => void; product: ProductLite | null }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const register = useServerFn(registerBitacora);
  if (!product) return null;

  const sendWa = async () => {
    if (!customerName.trim()) { toast.error("Ingresa tu nombre"); return; }
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    const msg = [
      `Hola, me interesa cotizar el siguiente producto:`,
      `*${product.name}*${product.brand ? ` — ${product.brand}` : ""}${product.model ? ` ${product.model}` : ""}`,
      product.code ? `Código: ${product.code}` : null,
      customerName ? `Cliente: ${customerName}` : null,
      phone ? `Teléfono: ${phone}` : null,
      notes ? `Detalles: ${notes}` : null,
    ].filter(Boolean).join("\n");
    try {
      await register({ data: {
        cliente_nombre: customerName,
        cliente_telefono: phone,
        producto_servicio: `${product.name}${product.brand ? " · " + product.brand : ""}`,
        categoria: "linea-blanca",
        origen: "catalogo",
        observaciones: notes,
        meta: { product_id: product.id, code: product.code ?? null },
        consent: true,
      } as any });
    } catch (e) { console.warn(e); }
    logLead({
      channel: "linea-blanca",
      product_id: product.id,
      product_name: product.name,
      customer_name: customerName || null,
    });
    window.open(buildWaUrl("linea-blanca", msg), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square rounded-xl bg-muted overflow-hidden">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <Package className="h-16 w-16" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-md bg-muted">
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.brand && <span className="rounded-full bg-primary-soft px-2 py-1 font-medium text-primary">{product.brand}</span>}
              {product.model && <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">Modelo {product.model}</span>}
              {product.code && <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">Código {product.code}</span>}
            </div>

            {product.description && <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{product.description}</p>}

            {product.features && product.features.length > 0 && (
              <ul className="mt-4 grid gap-1.5 text-sm">
                {product.features.map((f, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{f}</li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-xl border border-border bg-primary-soft/40 p-4">
              <div className="text-sm font-semibold text-primary">Cotización por WhatsApp</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Todas nuestras cotizaciones y ventas se realizan de forma personalizada por WhatsApp. Envíanos tus datos y te atendemos al instante.
              </p>

              <Input
                placeholder="Tu nombre (opcional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-4"
                maxLength={80}
              />
              <Textarea
                placeholder="¿Alguna preferencia o pregunta? (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
                maxLength={500}
              />

              <Button onClick={sendWa} className="mt-3 w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" size="lg">
                <MessageCircle className="mr-2 h-4 w-4" />
                Solicitar cotización por WhatsApp
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
