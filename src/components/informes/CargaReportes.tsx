/**
 * Carga manual de los reportes internos con reconocimiento de valores.
 * Cada reporte se lee en el navegador (PDF/Excel/CSV) y se envía al servidor,
 * que reconoce los montos y, si el formato es distinto, usa lectura con IA.
 */
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cargarReporte } from "@/lib/informes.functions";
import { extraerTexto } from "@/lib/informes-archivos";
import { REPORTES, bal, type InformeDatos } from "@/lib/informes-shared";

const CLAVE_EN_DATOS: Record<string, keyof InformeDatos | "morosidad" | "compras"> = {
  repfacmes: "repfacmes",
  repartven: "repartven",
  repvalor2: "repvalor2",
  repmorosos: "morosidad",
  repmorosos2: "morosidad",
  repclientes: "repclientes",
  repcompfch: "compras",
};

export function CargaReportes({
  token,
  periodo,
  datos,
  archivos,
  onCargado,
}: {
  token: string;
  periodo: string;
  datos: InformeDatos;
  archivos: { id: string; reporte: string; filename: string | null; resumen: any; created_at: string }[];
  onCargado: () => void;
}) {
  const cargar = useServerFn(cargarReporte);
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const subir = useMutation({
    mutationFn: async ({ reporte, file }: { reporte: string; file: File }) => {
      const texto = await extraerTexto(file);
      if (texto.trim().length < 20) throw new Error("No se pudo leer el contenido del archivo");
      return cargar({ data: { token, periodo, reporte, filename: file.name, texto } }) as any;
    },
    onSuccess: (r: any) => {
      toast.success(`Reporte reconocido con ${r.via}`);
      onCargado();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo procesar el reporte"),
    onSettled: () => setEnCurso(null),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Carga de reportes internos del mes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Acepta PDF, Excel (.xlsx/.xls), CSV y texto. Los valores se reconocen automáticamente; si el formato cambia,
          se usa lectura con inteligencia artificial.
        </p>

        {REPORTES.map((r) => {
          const cargado = Boolean((datos as any)[CLAVE_EN_DATOS[r.id] as string]);
          const ultimo = archivos.find((a) => a.reporte === r.id);
          const ocupado = enCurso === r.id && subir.isPending;
          return (
            <div key={r.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {r.nombre}
                    {cargado && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Cargado
                      </Badge>
                    )}
                  </div>
                  {ultimo && (
                    <div className="truncate text-xs text-muted-foreground">
                      {ultimo.filename ?? "archivo"} · {new Date(ultimo.created_at).toLocaleString("es-PA")} ·{" "}
                      {ultimo.resumen?.via ?? "lector automático"}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => refs.current[r.id]?.click()}
                >
                  {ocupado ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                  {cargado ? "Reemplazar" : "Cargar"}
                </Button>
              </div>

              {ultimo?.resumen && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {Object.entries(ultimo.resumen)
                    .filter(([k]) => k !== "via")
                    .map(([k, v]) => (
                      <span key={k}>
                        <strong className="font-medium text-foreground">{k.replace(/_/g, " ")}:</strong>{" "}
                        {typeof v === "number" && Math.abs(v) > 999 ? bal(v) : String(v)}
                      </span>
                    ))}
                </div>
              )}

              <input
                ref={(el) => {
                  refs.current[r.id] = el;
                }}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt,.ods"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setEnCurso(r.id);
                  subir.mutate({ reporte: r.id, file: f });
                }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
