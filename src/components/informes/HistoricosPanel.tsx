/**
 * Históricos mensuales (solo administración): ventas, recibos, morosidad,
 * clientes nuevos, seguidores de Instagram y alertas por mes.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { historicosMensuales } from "@/lib/informes.functions";
import { bal, fmt } from "@/lib/informes-shared";
import { etiquetaPeriodo } from "./SeguimientoAlertas";

export function HistoricosPanel({ token }: { token: string }) {
  const fn = useServerFn(historicosMensuales);
  const { data, isLoading } = useQuery({
    queryKey: ["informe-historicos"],
    queryFn: () => fn({ data: { token } }) as any,
  });

  const filas = (data?.historicos ?? []) as { periodo: string; metricas: any }[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Archive className="h-5 w-5 text-primary" /> Históricos mensuales
          <Badge variant="secondary" className="text-[10px]">Solo administración</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando históricos…</p>}
        {!isLoading && filas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aún no hay históricos. Cada vez que se genera un informe se guarda la fotografía del mes.
          </p>
        )}
        {filas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60">
                  {[
                    "Mes",
                    "Ventas contado",
                    "Ventas crédito",
                    "Ventas total",
                    "Recibos (monto)",
                    "N.º recibos",
                    "Morosidad vencida",
                    "No vencida",
                    "Cartera",
                    "Clientes nuevos",
                    "Instagram",
                    "Alertas abiertas",
                    "Arrastre",
                  ].map((h) => (
                    <th key={h} className="border border-border px-2 py-1 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const m = f.metricas ?? {};
                  return (
                    <tr key={f.periodo}>
                      <td className="border border-border px-2 py-1">{etiquetaPeriodo(f.periodo)}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.ventas?.contado)}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.ventas?.credito)}</td>
                      <td className="border border-border px-2 py-1 text-right font-semibold">{bal(m.ventas?.total)}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.recibos?.total)}</td>
                      <td className="border border-border px-2 py-1 text-right">{m.recibos?.cantidad ?? 0}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.morosidad?.vencida)}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.morosidad?.no_vencida)}</td>
                      <td className="border border-border px-2 py-1 text-right">{bal(m.morosidad?.saldo_cartera)}</td>
                      <td className="border border-border px-2 py-1 text-right">{fmt(m.clientes_nuevos ?? 0)}</td>
                      <td className="border border-border px-2 py-1 text-right">{m.instagram ?? 0}</td>
                      <td className="border border-border px-2 py-1 text-right">{m.alertas?.abiertas ?? 0}</td>
                      <td className="border border-border px-2 py-1 text-right">{m.alertas?.arrastre ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
