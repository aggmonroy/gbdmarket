import { useState } from "react";
import { AlertTriangle, Clock, Scissors, Check, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const SHORT_BORDADO_NOTICE =
  "El bordado solo aplica a textiles. Tazas, vasos, baldosas y placas se trabajan con estampado, sublimado o sticker. Bordado: 8 días hábiles. Estampado: 5 días hábiles.";

export const FULL_BORDADO_POLICY = `Condiciones y Tiempos de Entrega – Sección de Bordados

Materiales aptos para bordado
El bordado es una técnica exclusiva para textiles (camisas, gorras, toallas, delantales, entre otros).

No aplica para: tazas, vasos, baldosas, placas y artículos similares de superficie rígida — el hilo no se adhiere a estos materiales.

Para estos productos ofrecemos: estampado, sublimado o sticker, que sí logran un acabado duradero y de calidad sobre superficies rígidas.

¿Tienes dudas sobre qué técnica aplica a tu producto? Escríbenos y te asesoramos antes de confirmar el pedido.

Tiempos de entrega
• Bordado: mínimo 8 días hábiles. Puede extenderse según el volumen del pedido.
• Estampado: mínimo 5 días hábiles.

Los tiempos indicados son mínimos y aplican a partir de la confirmación del pedido y sus especificaciones (diseño, cantidad y ubicación del bordado o estampado). Pedidos de mayor volumen pueden requerir un plazo adicional, el cual te confirmaremos antes de procesar tu orden.`;

interface BordadoPolicyProps {
  /** Mostrar solo el banner resumido (sin checkbox). */
  compact?: boolean;
  /** Control externo del checkbox de aceptación. */
  accepted?: boolean;
  onChange?: (v: boolean) => void;
  id?: string;
  className?: string;
}

export function BordadoPolicy({
  compact,
  accepted,
  onChange,
  id = "bordado-policy",
  className = "",
}: BordadoPolicyProps) {
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-medium leading-relaxed">{SHORT_BORDADO_NOTICE}</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800 dark:text-amber-300">
                  <Info className="h-3 w-3" /> Ver condiciones completas
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-primary" />
                    Condiciones y tiempos de entrega – Bordados
                  </DialogTitle>
                  <DialogDescription>
                    Lee atentamente antes de confirmar tu pedido.
                  </DialogDescription>
                </DialogHeader>
                <PolicyBody />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setOpen(false)}>Entendido</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/30 p-4 text-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Clock className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Condiciones de Bordado</div>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            {SHORT_BORDADO_NOTICE}
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                <Info className="h-3 w-3" /> Leer política completa
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  Condiciones y tiempos de entrega – Bordados
                </DialogTitle>
                <DialogDescription>
                  Información importante sobre materiales aptos y tiempos de entrega.
                </DialogDescription>
              </DialogHeader>
              <PolicyBody />
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setOpen(false)}>Entendido</Button>
              </div>
            </DialogContent>
          </Dialog>

          {onChange && accepted !== undefined && (
            <label htmlFor={id} className="mt-4 flex cursor-pointer items-start gap-3">
              <Checkbox
                id={id}
                checked={accepted}
                onCheckedChange={(v) => onChange(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-foreground/85">
                He leído y acepto las{" "}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  condiciones de bordado y tiempos de entrega
                </button>
                . Entiendo que el bordado solo aplica a textiles y que los tiempos mínimos son 8 días hábiles para bordado y 5 días hábiles para estampado.
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function PolicyBody() {
  return (
    <div className="mt-2 space-y-4 text-sm leading-relaxed">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Aviso importante
        </div>
        <p className="mt-1">
          El bordado es una técnica exclusiva para textiles (camisas, gorras, toallas, delantales, entre otros). No aplica para tazas, vasos, baldosas, placas y artículos similares de superficie rígida.
        </p>
        <p className="mt-2">
          Para estos productos ofrecemos estampado, sublimado o sticker, técnicas que garantizan un acabado duradero y de calidad sobre superficies rígidas.
        </p>
      </div>

      <div>
        <h4 className="font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" /> Materiales aptos para bordado
        </h4>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
          <li>Camisas, polos y chompas</li>
          <li>Gorras y viseras</li>
          <li>Toallas y batas</li>
          <li>Delantales y mochilas</li>
          <li>Otros artículos de tela</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Tiempos de entrega
        </h4>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="font-semibold">Bordado</div>
            <div className="text-2xl font-bold text-primary">8 días hábiles</div>
            <div className="text-xs text-muted-foreground">Mínimo. Puede extenderse según volumen.</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="font-semibold">Estampado</div>
            <div className="text-2xl font-bold text-primary">5 días hábiles</div>
            <div className="text-xs text-muted-foreground">Mínimo. Aplica a partir de confirmación.</div>
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">
          Los tiempos indicados son mínimos y aplican a partir de la confirmación del pedido y sus especificaciones (diseño, cantidad y ubicación del bordado o estampado). Pedidos de mayor volumen pueden requerir un plazo adicional, el cual te confirmaremos antes de procesar tu orden.
        </p>
      </div>

      <p className="text-muted-foreground">
        ¿Tienes dudas sobre qué técnica aplica a tu producto? Escríbenos y te asesoramos antes de confirmar el pedido.
      </p>
    </div>
  );
}
