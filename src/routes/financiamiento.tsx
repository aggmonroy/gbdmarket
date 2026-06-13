import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TERMS, calcFinancing, fmtUSD, MEMBER_LABEL, SURCHARGE, type Term, type MemberType } from "@/lib/financing";

export const Route = createFileRoute("/financiamiento")({
  head: () => ({
    meta: [
      { title: "Financiamiento Cooperativo · Calculadora · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Calcula al instante el abono inicial y cuotas para tu compra de Línea Blanca. Opciones para asociados y no asociados, de 3 a 36 meses." },
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
  const fin = calcFinancing(price, term, member);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-4xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold">Financiamiento Cooperativo</h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        Plazos de 3 a 36 meses con cuotas quincenales o mensuales. Elige tu modalidad: asociados con recargo del 35% y no asociados con recargo del 65% sobre el precio contado.
      </p>

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
                <span className="block text-[10px] font-normal opacity-80">+{Math.round(SURCHARGE[m] * 100)}% recargo</span>
              </button>
            ))}
          </div>

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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-primary">Resumen estimado</div>
            <span className="text-[11px] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-1">
              {MEMBER_LABEL[member]} · +{Math.round(fin.surchargePct * 100)}%
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Recargo aplicado" value={fmtUSD(fin.surchargeAmount)} />
            <Stat label="Total a financiar" value={fmtUSD(fin.totalFinanced)} />
            <Stat label="Abono inicial (10%)" value={fmtUSD(fin.down)} />
            <Stat label="Cuota mensual" value={fmtUSD(fin.monthly)} highlight />
            <Stat label="Cuota quincenal" value={fmtUSD(fin.biweekly)} />
          </dl>
          <a
            href={`https://wa.me/50767841941?text=${encodeURIComponent(`Hola, deseo cotizar un financiamiento como ${MEMBER_LABEL[member]} por ${fmtUSD(price)} a ${term} meses. Cuota mensual estimada: ${fmtUSD(fin.monthly)}.`)}`}
            target="_blank" rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground hover:opacity-90"
          >
            Solicitar esta cotización por WhatsApp
          </a>
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
