import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TERMS, calcFinancing, fmtUSD, type Term } from "@/lib/financing";

export const Route = createFileRoute("/financiamiento")({
  head: () => ({
    meta: [
      { title: "Financiamiento Cooperativo · Calculadora · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Calcula al instante el abono inicial, cuota quincenal y cuota mensual para tu compra de Línea Blanca con financiamiento cooperativo de 3 a 36 meses." },
      { property: "og:title", content: "Calculadora de Financiamiento Cooperativo" },
      { property: "og:description", content: "Conoce las cuotas estimadas para tu compra antes de cotizar." },
      { property: "og:url", content: "/financiamiento" },
    ],
    links: [{ rel: "canonical", href: "/financiamiento" }],
  }),
  component: Financiamiento,
});

function Financiamiento() {
  const [price, setPrice] = useState(800);
  const [term, setTerm] = useState<Term>(12);
  const fin = calcFinancing(price, term);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-4xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold">Financiamiento Cooperativo</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        Plazos de 3 a 36 meses con cuotas quincenales o mensuales. Calcula el costo estimado de tu próxima compra y solicita tu cotización por WhatsApp.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio contado del producto</div>
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
          <div className="text-sm font-semibold text-primary">Resumen estimado</div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Abono inicial (10%)" value={fmtUSD(fin.down)} />
            <Stat label="Cuota mensual" value={fmtUSD(fin.monthly)} highlight />
            <Stat label="Cuota quincenal" value={fmtUSD(fin.biweekly)} />
            <Stat label="Total financiado" value={fmtUSD(fin.totalFinanced)} />
          </dl>
          <a
            href={`https://wa.me/50767841941?text=${encodeURIComponent(`Hola, deseo cotizar un financiamiento por ${fmtUSD(price)} a ${term} meses. Cuota mensual estimada: ${fmtUSD(fin.monthly)}.`)}`}
            target="_blank" rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground hover:opacity-90"
          >
            Solicitar esta cotización por WhatsApp
          </a>
          <p className="mt-3 text-[11px] text-muted-foreground">
            *Cálculo estimado con tasa anual referencial. La cotización oficial será confirmada por un asesor cooperativo según la política vigente y el perfil del asociado.
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
