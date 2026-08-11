/**
 * Versión imprimible del informe: la gerencia elige qué secciones incluir
 * para la presentación a la junta directiva. Presenta una portada ejecutiva
 * con la paleta institucional y los gráficos de cada sección.
 */
import { useState } from "react";
import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardInforme } from "./DashboardInforme";
import { PreambuloInforme } from "./PreambuloInforme";
import { SECCIONES_INFORME, infoPeriodo, type InformeMensual, type SeccionId } from "@/lib/informes-shared";

export function InformeImprimible({
  informe,
  series,
}: {
  informe: InformeMensual;
  series: { serie: string; periodo: string; datos: Record<string, number> }[];
}) {
  const [seleccion, setSeleccion] = useState<SeccionId[]>(SECCIONES_INFORME.map((s) => s.id));
  const { mesNombre, anio, periodoFiscal } = infoPeriodo(informe.periodo);

  const alternar = (id: SeccionId) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const incluidas = SECCIONES_INFORME.filter((s) => seleccion.includes(s.id));

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4 text-primary" /> Vista ejecutiva · secciones a imprimir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECCIONES_INFORME.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2 text-sm transition-colors hover:bg-muted/40"
              >
                <Checkbox checked={seleccion.includes(s.id)} onCheckedChange={() => alternar(s.id)} />
                <span>{s.nombre}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => window.print()} disabled={!seleccion.length}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir / guardar PDF
            </Button>
            <Button variant="outline" onClick={() => setSeleccion(SECCIONES_INFORME.map((s) => s.id))}>
              Seleccionar todo
            </Button>
            <Button variant="ghost" onClick={() => setSeleccion([])}>
              Quitar todo
            </Button>
            <span className="text-xs text-muted-foreground">
              {seleccion.length} de {SECCIONES_INFORME.length} secciones
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="informe-print rounded-xl border border-border bg-background p-3 print:rounded-none print:border-0 print:p-0">
        <DashboardInforme informe={informe} series={series} secciones={seleccion} imprimible />



        <div className="mt-4 hidden justify-between border-t border-border pt-2 text-[10px] text-muted-foreground print:flex">
          <span>
            Informe {mesNombre} {anio} · Mueblería GBD
          </span>
          <span>Generado el {new Date().toLocaleDateString("es-PA")}</span>
        </div>
      </div>
    </div>
  );
}
