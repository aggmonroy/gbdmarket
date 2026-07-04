import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAuditLog } from "@/lib/drafts.functions";
import { exportAuditCsv, exportAuditJson } from "@/lib/audit-export.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  component: AuditPage,
});

const ACTIONS: Record<string, string> = {
  create: "Creación",
  update: "Actualización",
  delete: "Eliminación",
  draft: "Borrador",
  publish: "Publicación",
  discard_draft: "Descartar borrador",
  publish_all: "Publicación masiva",
  bulk_import: "Importación CSV",
};
const ENTITIES: Record<string, string> = {
  product: "Producto",
  content_block: "Contenido",
  promotion: "Promoción",
  site_setting: "Ajuste",
  batch: "Lote",
};

function toIso(d: string): string | undefined {
  if (!d) return undefined;
  const iso = new Date(d).toISOString();
  return iso;
}

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AuditPage() {
  const listFn = useServerFn(listAuditLog);
  const csvFn = useServerFn(exportAuditCsv);
  const jsonFn = useServerFn(exportAuditJson);

  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [userEmail, setUserEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit-log", entity],
    queryFn: () => listFn({ data: { limit: 300, ...(entity !== "all" ? { entityType: entity } : {}) } }),
  });

  async function exportAs(kind: "csv" | "json") {
    setExporting(kind);
    try {
      const filters = {
        ...(entity !== "all" ? { entity_type: entity } : {}),
        ...(action !== "all" ? { action } : {}),
        ...(userEmail ? { user_email: userEmail } : {}),
        ...(from ? { from: toIso(from) } : {}),
        ...(to ? { to: toIso(to) } : {}),
        limit: 5000,
      };
      const res = kind === "csv" ? await csvFn({ data: filters }) : await jsonFn({ data: filters });
      download(res.filename, res.contents, kind === "csv" ? "text/csv" : "application/json");
      toast.success(`Exportado ${kind.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al exportar");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Registro de auditoría</h1>
          <p className="text-sm text-muted-foreground">
            Últimos {rows.length} eventos registrados. Filtra y exporta para revisión interna.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={exporting !== null} onClick={() => exportAs("csv")}>
            <Download className="h-4 w-4 mr-1" /> {exporting === "csv" ? "…" : "CSV"}
          </Button>
          <Button variant="outline" size="sm" disabled={exporting !== null} onClick={() => exportAs("json")}>
            <Download className="h-4 w-4 mr-1" /> {exporting === "json" ? "…" : "JSON"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="product">Productos</SelectItem>
                <SelectItem value="content_block">Contenido</SelectItem>
                <SelectItem value="promotion">Promociones</SelectItem>
                <SelectItem value="site_setting">Ajustes / SEO</SelectItem>
                <SelectItem value="batch">Lotes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Acción</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(ACTIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Usuario (email)</Label>
            <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="admin@…" />
          </div>
          <div>
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Acción</th>
                    <th className="py-2 pr-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">{r.user_email ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{ENTITIES[r.entity_type] ?? r.entity_type}</Badge>
                      </td>
                      <td className="py-2 pr-3">{ACTIONS[r.action] ?? r.action}</td>
                      <td className="py-2 pr-3">
                        <div>{r.summary ?? ""}</div>
                        {r.changes && (
                          <details className="text-xs text-muted-foreground mt-1">
                            <summary className="cursor-pointer">Ver cambios</summary>
                            <pre className="mt-1 overflow-x-auto bg-muted/40 p-2 rounded text-[10px]">
                              {JSON.stringify(r.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
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
