/**
 * Versión imprimible del informe: la gerencia elige qué secciones incluir
 * para la presentación a la junta directiva.
 */
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardInforme } from "./DashboardInforme";
import { SECCIONES_INFORME, type InformeMensual, type SeccionId } from "@/lib/informes-shared";

export function InformeImprimible({
  informe,
  series,
}: {
  informe: InformeMensual;
  series: { serie: string; periodo: string; datos: Record<string, number> }[];
}) {
  const [seleccion, setSeleccion] = useState<SeccionId[]>(SECCIONES_INFORME.map((s) => s.id));

  const alternar = (id: SeccionId) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Secciones a imprimir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECCIONES_INFORME.map((s) => (
              <label key={s.id} className="flex items-start gap-2 text-sm">
                <Checkbox checked={seleccion.includes(s.id)} onCheckedChange={() => alternar(s.id)} />
                <span>{s.nombre}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()} disabled={!seleccion.length}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir / guardar PDF
            </Button>
            <Button variant="outline" onClick={() => setSeleccion(SECCIONES_INFORME.map((s) => s.id))}>
              Seleccionar todo
            </Button>
            <Button variant="ghost" onClick={() => setSeleccion([])}>
              Quitar todo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-background p-2 print:p-0">
        <DashboardInforme informe={informe} series={series} secciones={seleccion} imprimible />
      </div>
    </div>
  );
}
