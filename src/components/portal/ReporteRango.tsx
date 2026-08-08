import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reporteRespuesta } from "@/lib/tareas.functions";
import { ESTADO_TAREA_LABEL, ORIGEN_TAREA_LABEL, ORIGENES_TAREA, normalizarEstado } from "@/lib/tareas-shared";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

const hoy = () => new Date().toISOString().slice(0, 10);
const haceUnMes = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const fmt = (h: number | null) => (h === null ? "—" : h < 24 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} días`);

/** Genera el reporte imprimible (PDF) de capacidad de respuesta por rango de fechas. */
export function ReporteRango({ sesion, ambitoInicial }: { sesion: Sesion; ambitoInicial: "activas" | "cerradas" }) {
  const reporteFn = useServerFn(reporteRespuesta);
  const [open, setOpen] = useState(false);
  const [desde, setDesde] = useState(haceUnMes());
  const [hasta, setHasta] = useState(hoy());
  const [origen, setOrigen] = useState<string>("todos");
  const [ambito, setAmbito] = useState<"activas" | "cerradas">(ambitoInicial);
  const [cargando, setCargando] = useState(false);

  const generar = async () => {
    setCargando(true);
    try {
      const r: any = await reporteFn({ data: { token: sesion.token, desde, hasta, origen: origen as any, ambito } });
      imprimir(r);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el reporte");
    } finally {
      setCargando(false);
    }
  };

  const imprimir = (r: any) => {
    const filas = (r.items ?? [])
      .map(
        (t: any) => `<tr>
          <td>${t.numero_orden ?? ""}</td>
          <td>${escapar(t.titulo)}</td>
          <td>${ORIGEN_TAREA_LABEL[t.origen as keyof typeof ORIGEN_TAREA_LABEL] ?? t.origen ?? "—"}</td>
          <td>${ESTADO_TAREA_LABEL[normalizarEstado(t.estado)] ?? t.estado}</td>
          <td>${escapar(t.responsable ?? "Sin asignar")}</td>
          <td>${escapar(t.apoyo ?? "—")}</td>
          <td>${t.fecha ?? ""}</td>
          <td>${fmt(t.horas_para_aceptar)}</td>
          <td>${fmt(t.horas_para_cerrar)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
      <title>Reporte de capacidad de respuesta ${r.desde} a ${r.hasta}</title>
      <style>
        body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1f2937;margin:28px}
        h1{font-size:19px;margin:0 0 4px}
        .sub{color:#6b7280;font-size:12px;margin-bottom:16px}
        .kpis{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
        .kpi{border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;min-width:150px}
        .kpi span{display:block;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}
        .kpi strong{font-size:18px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #e5e7eb;padding:5px 6px;text-align:left;vertical-align:top}
        th{background:#f3f4f6}
        @media print{@page{size:landscape;margin:12mm}}
      </style></head><body>
      <h1>Cooperativa Gladys B. de Ducasa, R.L. — Capacidad de respuesta</h1>
      <div class="sub">${ambito === "cerradas" ? "Casos cerrados" : "Solicitudes activas"} · ${r.desde} a ${r.hasta} ·
        Origen: ${origen === "todos" ? "Todos" : ORIGEN_TAREA_LABEL[origen as keyof typeof ORIGEN_TAREA_LABEL]} ·
        Generado por ${escapar(sesion.colaborador.nombre)} el ${new Date().toLocaleString("es-PA")}</div>
      <div class="kpis">
        <div class="kpi"><span>Registros</span><strong>${r.total}</strong></div>
        <div class="kpi"><span>Promedio de aceptación</span><strong>${fmt(r.promedio_aceptacion_horas)}</strong></div>
        <div class="kpi"><span>Promedio de cierre</span><strong>${fmt(r.promedio_cierre_horas)}</strong></div>
      </div>
      <table><thead><tr><th>N.º</th><th>Asunto</th><th>Origen</th><th>Estado</th><th>Responsable</th><th>Apoyo</th>
        <th>Fecha</th><th>Aceptación</th><th>Cierre</th></tr></thead>
        <tbody>${filas || `<tr><td colspan="9">Sin registros en el rango seleccionado.</td></tr>`}</tbody></table>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Permite las ventanas emergentes para ver el reporte");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-1.5 h-4 w-4" /> Reporte PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reporte de capacidad de respuesta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ámbito</Label>
            <Select value={ambito} onValueChange={(v) => setAmbito(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cerradas">Casos cerrados</SelectItem>
                <SelectItem value="activas">Solicitudes activas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Origen</Label>
            <Select value={origen} onValueChange={setOrigen}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ORIGENES_TAREA.map((o) => (
                  <SelectItem key={o} value={o}>
                    {ORIGEN_TAREA_LABEL[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={generar} disabled={cargando || !desde || !hasta}>
          {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generar e imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function escapar(s: any) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
