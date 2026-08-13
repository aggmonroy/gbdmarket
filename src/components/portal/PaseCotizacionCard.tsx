import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generarPaseCotizacion } from "@/lib/garantias.functions";

/** Genera el enlace privado que abre la calculadora sin pedir cédula ni PIN. */
export function PaseCotizacionCard({ token }: { token: string }) {
  const generar = useServerFn(generarPaseCotizacion);
  const [enlace, setEnlace] = useState("");

  const m = useMutation({
    mutationFn: () => generar({ data: { token, dias: 90 } }) as any,
    onSuccess: (r: any) => {
      setEnlace(`${window.location.origin}/cotizar?k=${encodeURIComponent(r.pase)}`);
      toast.success("Enlace generado. Válido por 90 días.");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo generar el enlace"),
  });

  const copiar = async () => {
    await navigator.clipboard.writeText(enlace);
    toast.success("Enlace copiado");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-5 w-5 text-primary" /> Enlace directo a cotizaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Enlace privado y personal: abre la calculadora sin cédula ni PIN. No lo compartas con clientes; caduca en 90 días
          y puedes generar uno nuevo cuando quieras.
        </p>
        {enlace ? (
          <div className="flex gap-2">
            <Input readOnly value={enlace} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" onClick={copiar}>
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
          </div>
        ) : null}
        <Button onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? "Generando…" : enlace ? "Generar uno nuevo" : "Generar mi enlace"}
        </Button>
      </CardContent>
    </Card>
  );
}
