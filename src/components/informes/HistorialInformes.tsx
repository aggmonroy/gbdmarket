/**
 * Histórico de informes mensuales (solo administración).
 * Permite consultar los períodos guardados, sus cargas de archivos y
 * eliminar por completo un informe con datos erróneos.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { History, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { eliminarInforme, historialInformes } from "@/lib/informes.functions";
import { REPORTES, bal, infoPeriodo } from "@/lib/informes-shared";

const nombreReporte = (id: string) => REPORTES.find((r) => r.id === id)?.nombre ?? id;

export function HistorialInformes({
  token,
  onCambio,
  onVerPeriodo,
}: {
  token: string;
  onCambio: () => void;
  onVerPeriodo: (periodo: string) => void;
}) {
  const historialFn = useServerFn(historialInformes);
  const borrarFn = useServerFn(eliminarInforme);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["informes-historial"],
    queryFn: () => historialFn({ data: { token } }) as any,
  });

  const borrar = useMutation({
    mutationFn: (periodo: string) => borrarFn({ data: { token, periodo } }) as any,
    onSuccess: () => {
      toast.success("Informe eliminado del histórico");
      refetch();
      onCambio();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo eliminar el informe"),
  });

  const informes: any[] = data?.informes ?? [];
  const archivos: any[] = data?.archivos ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" /> Histórico de informes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando histórico…</p>}
          {!isLoading && !informes.length && (
            <p className="text-sm text-muted-foreground">Todavía no hay informes guardados.</p>
          )}
          {informes.map((i) => {
            const { mesNombre } = infoPeriodo(i.periodo);
            const [anio] = i.periodo.split("-");
            return (
              <div
                key={i.periodo}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium capitalize">
                    {mesNombre} {anio}
                    <Badge variant={i.estado === "generado" ? "default" : "secondary"}>{i.estado}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ventas {bal(i.ventas)} · Abonos {bal(i.abonos)} · {i.reportes} bloque(s) de datos ·{" "}
                    {i.generado_en
                      ? `generado ${new Date(i.generado_en).toLocaleString("es-PA")}`
                      : `actualizado ${new Date(i.updated_at ?? i.created_at).toLocaleString("es-PA")}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onVerPeriodo(i.periodo)}>
                    Ver
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={borrar.isPending}>
                        {borrar.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar el informe de {mesNombre} {anio}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se borran los datos reconocidos, los textos y el registro de archivos cargados de ese mes.
                          Las series históricas se conservan. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => borrar.mutate(i.periodo)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Archivos cargados</CardTitle>
        </CardHeader>
        <CardContent>
          {!archivos.length && <p className="text-sm text-muted-foreground">Sin cargas registradas.</p>}
          {!!archivos.length && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60">
                    {["Fecha", "Período", "Reporte", "Archivo", "Lectura"].map((h) => (
                      <th key={h} className="border border-border px-2 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivos.map((a) => (
                    <tr key={a.id}>
                      <td className="border border-border px-2 py-1">
                        {new Date(a.created_at).toLocaleString("es-PA")}
                      </td>
                      <td className="border border-border px-2 py-1">{a.periodo}</td>
                      <td className="border border-border px-2 py-1">{nombreReporte(a.reporte)}</td>
                      <td className="border border-border px-2 py-1">{a.filename ?? "—"}</td>
                      <td className="border border-border px-2 py-1">{a.resumen?.via ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
