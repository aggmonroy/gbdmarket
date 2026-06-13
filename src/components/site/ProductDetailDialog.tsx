import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TERMS, calcFinancing, fmtUSD, MEMBER_LABEL, PROMO_MAX_TERM, type Term, type MemberType } from "@/lib/financing";
import { buildWaUrl, logLead } from "@/lib/whatsapp";
import { FileText, MessageCircle, Package, Sparkles } from "lucide-react";

export type ProductLite = {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  code?: string | null;
  description?: string | null;
  features?: string[] | null;
  price_cash: number;
  stock: number;
  images: string[];
  datasheet_url?: string | null;
};

export function ProductDetailDialog({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (b: boolean) => void; product: ProductLite | null }) {
  const [term, setTerm] = useState<Term>(12);
  const [member, setMember] = useState<MemberType>("asociado");
  const [directDebit, setDirectDebit] = useState(false);
  const [customerName, setCustomerName] = useState("");
  if (!product) return null;
  const fin = calcFinancing(product.price_cash, term, member, directDebit);

  const sendWa = () => {
    const msg = [
      `Hola, me interesa cotizar el siguiente producto:`,
      `*${product.name}*${product.brand ? ` — ${product.brand}` : ""}${product.model ? ` ${product.model}` : ""}`,
      product.code ? `Código: ${product.code}` : null,
      `Precio contado: ${fmtUSD(product.price_cash)}`,
      `Modalidad: ${MEMBER_LABEL[member]}${directDebit ? " (descuento directo)" : ""}`,
      `Plazo seleccionado: ${term} meses${fin.promoApplied ? " · Promo sin intereses" : ""}`,
      `Abono inicial: ${fmtUSD(fin.down)}`,
      `Cuota mensual: ${fmtUSD(fin.monthly)}`,
      `Total financiado: ${fmtUSD(fin.totalFinanced)}`,
      customerName ? `Cliente: ${customerName}` : null,
    ].filter(Boolean).join("\n");
    logLead({
      channel: "linea-blanca",
      product_id: product.id,
      product_name: product.name,
      customer_name: customerName || null,
      term_months: term,
      total_price: fin.totalFinanced,
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
              <span className={`rounded-full px-2 py-1 font-medium ${product.stock > 0 ? "bg-[oklch(0.95_0.06_155)] text-[oklch(0.4_0.16_155)]" : "bg-destructive/10 text-destructive"}`}>
                {product.stock > 0 ? `${product.stock} en existencia` : "Agotado"}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Precio contado</div>
              <div className="font-display text-4xl font-bold text-primary">{fmtUSD(product.price_cash)}</div>
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
              <div className="text-sm font-semibold text-primary">Financiamiento Cooperativa</div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["asociado", "no_asociado"] as MemberType[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMember(m)}
                    className={`px-2 py-2 rounded-md text-xs font-semibold border transition ${
                      member === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
                    }`}
                  >
                    {MEMBER_LABEL[m]}
                  </button>
                ))}
              </div>

              <label className="mt-3 flex items-start gap-2 rounded-md border border-border bg-background p-2.5 cursor-pointer hover:border-primary/40 transition">
                <input
                  type="checkbox"
                  checked={directDebit}
                  onChange={(e) => setDirectDebit(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs">
                  <span className="font-semibold">Pago por descuento directo</span>
                  <span className="block text-muted-foreground">
                    Hasta {PROMO_MAX_TERM} meses al contado, sin intereses.
                  </span>
                </span>
              </label>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerm(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      term === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/40"
                    }`}
                  >{t} meses</button>
                ))}
              </div>

              {fin.promoApplied && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Promo sin intereses aplicada
                </div>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label={fin.promoApplied ? "Total (contado)" : "Total a financiar"} value={fmtUSD(fin.totalFinanced)} />
                <Stat label="Abono inicial (10%)" value={fmtUSD(fin.down)} />
                <Stat label="Cuota mensual" value={fmtUSD(fin.monthly)} highlight />
                <Stat label="Cuota quincenal" value={fmtUSD(fin.biweekly)} />
              </dl>

              <Input
                placeholder="Tu nombre (opcional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-4"
                maxLength={80}
              />

              <Button onClick={sendWa} className="mt-3 w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" size="lg">
                <MessageCircle className="mr-2 h-4 w-4" />
                Solicitar esta cotización por WhatsApp
              </Button>

              {product.datasheet_url && (
                <a
                  href={product.datasheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 text-sm text-primary hover:underline"
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

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${highlight ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-base font-bold">{value}</div>
    </div>
  );
}
