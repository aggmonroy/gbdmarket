import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { TERMS, calcFinancing, fmtUSD, MEMBER_LABEL, PROMO_MAX_TERM, type Term, type MemberType } from "@/lib/financing";
import { Sparkles } from "lucide-react";
import { crearPreorden } from "@/lib/pedidos.functions";
import { DataConsent } from "@/components/site/DataConsent";

export const Route = createFileRoute("/financiamiento")({
  head: () => ({
    meta: [
      { title: "Financiamiento Cooperativo · Calculadora · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Calcula al instante el abono inicial y cuotas para tu compra de Línea Blanca. Opciones para asociados y no asociados, de 3 a 24 meses." },
      { property: "og:title", content: "Calculadora de Financiamiento Cooperativo" },
      { property: "og:description", content: "Conoce las cuotas estimadas para tu compra antes de cotizar." },
      { property: "og:url", content: "/financiamiento" },
    ],
    links: [{ rel: "canonical", href: "/financiamiento" }],
  }),
  component: Financiamiento,
});

const MEMBER_OPTIONS: MemberType[] = ["asociado", "no_asociado"];

function Financiamiento() {
  const [price, setPrice] = useState(800);
  const [term, setTerm] = useState<Term>(12);
  const [member, setMember] = useState<MemberType>("asociado");
  const [directDebit, setDirectDebit] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const crearPre = useServerFn(crearPreorden);
  const navigate = useNavigate();
  const fin = calcFinancing(price, term, member, directDebit);

  async function handleSolicitar() {
    if (!nombre.trim()) { toast.error("Ingresa tu nombre"); return; }
    if (!telefono.trim()) { toast.error("Ingresa tu teléfono"); return; }
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    setSending(true);
    const detalle = `Financiamiento como ${MEMBER_LABEL[member]} por ${fmtUSD(price)} a ${term} meses${directDebit ? " con descuento directo" : ""}. Cuota mensual estimada: ${fmtUSD(fin.monthly)}.`;
    try {
      const r: any = await crearPre({ data: {
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        origen: "financiamiento",
        canal: "linea-blanca",
        categoria: "financiamiento",
        observaciones: detalle,
        items: [{ cantidad: 1, descripcion: `Financiamiento ${term} meses · ${fmtUSD(price)}`, detalle }],
        meta: { price, term, member, directDebit, monthly: fin.monthly, biweekly: fin.biweekly, down: fin.down, totalFinanced: fin.totalFinanced },
        consent: true,
      } as any });
      toast.success("Pre-orden generada. Revisa, imprime o envíala por WhatsApp.");
      navigate({ to: "/pedido/$numero", params: { numero: r.numero_pedido } });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar la pre-orden. Intenta nuevamente.");
    }
    setSending(false);
  }


  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-4xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold">Financiamiento Cooperativo</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        Plazos de 3 a 24 meses con cuotas quincenales o mensuales. Elige tu modalidad: asociado o no asociado.
      </p>

      <div className="mt-6 rounded-xl border border-primary/30 bg-primary-soft/50 p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-primary">Promoción: hasta {PROMO_MAX_TERM} meses al contado, sin intereses</div>
          <p className="text-foreground/80 mt-1">
            Si autorizas el pago por <strong>descuento directo</strong> (planilla), mantienes el precio contado y no se aplica recargo en plazos de hasta {PROMO_MAX_TERM} meses.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de cliente</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MEMBER_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMember(m)}
                className={`px-3 py-2 rounded-md text-sm font-semibold border transition ${
                  member === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
                }`}
              >
                {MEMBER_LABEL[m]}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-md border border-border bg-background p-3 cursor-pointer hover:border-primary/40 transition">
            <input
              type="checkbox"
              checked={directDebit}
              onChange={(e) => setDirectDebit(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-semibold">Pago por descuento directo</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Aplica promoción de hasta {PROMO_MAX_TERM} meses al contado, sin intereses.
              </span>
            </span>
          </label>

          <div className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio contado del producto</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-primary">USD</span>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className="text-2xl h-14 font-bold" />
          </div>

          <div className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plazo</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TERMS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  term === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
                }`}
              >{t} meses</button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-primary-soft/40 p-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm font-semibold text-primary">Resumen estimado</div>
            <div className="flex items-center gap-2">
              {fin.promoApplied && (
                <span className="text-[11px] font-semibold uppercase tracking-wider rounded-full bg-primary text-primary-foreground px-2 py-1 inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Promo sin intereses
                </span>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-1">
                {MEMBER_LABEL[member]}
              </span>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label={fin.promoApplied ? "Total (precio contado)" : "Total a financiar"} value={fmtUSD(fin.totalFinanced)} />
            <Stat label="Abono inicial" value={fmtUSD(fin.down)} />
            <Stat label="Cuota mensual" value={fmtUSD(fin.monthly)} highlight />
            <Stat label="Cuota quincenal" value={fmtUSD(fin.biweekly)} />
          </dl>
          <div className="mt-5 space-y-2">
            <Input placeholder="Tu nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
            <Input placeholder="Teléfono / WhatsApp *" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={30} />
            <DataConsent accepted={consent} onChange={setConsent} id="fin-consent" />
          </div>
          <button
            type="button"
            onClick={handleSolicitar}
            disabled={sending || !consent}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Solicitar esta cotización por WhatsApp
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            *Cálculo estimado. La cotización oficial será confirmada por un asesor cooperativo según la política vigente y el perfil del cliente.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}
