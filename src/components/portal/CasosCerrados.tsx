import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Archive, ExternalLink, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { casosCerrados } from "@/lib/tareas.functions";
import { ORIGEN_TAREA_LABEL, ORIGENES_TAREA, diasEntre } from "@/lib/tareas-shared";
import { ReporteRango } from "./ReporteRango";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

const hoy = () => new Date().toISOString().slice(0, 10);
const haceTresMeses = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
};

const escapar = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** Bitácora de casos cerrados: consulta por rango y detalle imprimible. */
export function CasosCerrados({ sesion }: { sesion: Sesion }) {
  const listFn = useServerFn(casosCerrados);
  const [origen, setOrigen] = useState<string>("todos");
  const [desde, setDesde] = useState(haceTresMeses());
  const [hasta, setHasta] = useState(hoy());
  const [q, setQ] = useState("");

  const { data: items = [], isFetching } = useQuery({
    queryKey: ["casos-cerrados", origen, desde, hasta, q],
    queryFn: () =>
      listFn({ data: { token: sesion.token, origen: origen as any, desde, hasta, q: q || undefined } }) as any,
  });

  const imprimirCaso = (t: any) => {
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
      <title>Caso cerrado ${escapar(t.numero_orden ?? "")}</title>
      <style>
        body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1f2937;margin:32px;max-width:760px}
        h1{font-size:20px;margin:0 0 2px}
        .sub{color:#6b7280;font-size:12px;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
        th,td{border:1px solid #e5e7eb;padding:7px 9px;text-align:left;vertical-align:top}
        th{background:#f9fafb;width:38%}
        .nota{margin-top:16px;font-size:13px;white-space:pre-wrap}
      </style></head><body>
      <h1>Caso cerrado ${escapar(t.numero_orden ?? "")}</h1>
      <div class="sub">Cooperativa Gladys B. de Ducasa R.L. · Bitácora de casos cerrados</div>
      <table>
        <tr><th>Asunto</th><td>${escapar(t.titulo)}</td></tr>
        <tr><th>Origen</th><td>${escapar(ORIGEN_TAREA_LABEL[t.origen as keyof typeof ORIGEN_TAREA_LABEL] ?? t.origen ?? "—")}</td></tr>
        <tr><th>Responsable</th><td>${escapar(t.responsable ?? "Sin asignar")}</td></tr>
        <tr><th>Colaborador de apoyo</th><td>${escapar(t.apoyo ?? "—")}</td></tr>
        <tr><th>Fecha de apertura</th><td>${escapar(t.fecha ?? "")}</td></tr>
        <tr><th>Fecha de cierre</th><td>${escapar((t.cerrada_en ?? "").slice(0, 10) || "—")}</td></tr>
        <tr><th>Tiempo de respuesta</th><td>${diasEntre(t.created_at, t.cerrada_en) ?? "—"} días</td></tr>
        <tr><th>Detalle</th><td>${escapar(t.descripcion ?? "—")}</td></tr>
        <tr><th>Nota de cierre</th><td>${escapar(t.nota_cierre ?? "—")}</td></tr>
      </table>
      <div class="nota">Documento generado el ${new Date().toLocaleString("es-PA")}</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Archive className="h-5 w-5 text-primary" /> Bitácora de casos cerrados
        </CardTitle>
        <ReporteRango sesion={sesion} ambitoInicial="cerradas" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Origen</Label>
            <Select value={origen} onValueChange={setOrigen}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los orígenes</SelectItem>
                {ORIGENES_TAREA.map((o) => (
                  <SelectItem key={o} value={o}>
                    {ORIGEN_TAREA_LABEL[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Número, cliente o asunto" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        {!(items as any[]).length && (
          <p className="text-sm text-muted-foreground">
            {isFetching ? "Consultando…" : "No hay casos cerrados en este rango."}
          </p>
        )}

        <div className="space-y-3">
          {(items as any[]).map((t) => (
            <div key={t.id} className="rounded-md border border-border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge className="mb-1" variant="secondary">
                    {ORIGEN_TAREA_LABEL[t.origen as keyof typeof ORIGEN_TAREA_LABEL] ?? t.origen ?? "Registro interno"}
                  </Badge>
                  <div className="font-mono text-sm font-semibold">{t.numero_orden}</div>
                  <div className="text-sm">{t.titulo}</div>
                  {t.descripcion && <div className="text-xs text-muted-foreground">{t.descripcion}</div>}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.responsable}
                    {t.apoyo ? ` + ${t.apoyo}` : ""} · abierto {t.fecha} · cerrado{" "}
                    {(t.cerrada_en ?? "").slice(0, 10) || "—"} · {diasEntre(t.created_at, t.cerrada_en) ?? "—"} días
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.documento_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={t.documento_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver documento
                      </a>
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => imprimirCaso(t)}>
                    <Printer className="mr-1 h-3.5 w-3.5" /> Imprimir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
