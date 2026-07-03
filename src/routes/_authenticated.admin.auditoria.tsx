import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAuditLog } from "@/lib/drafts.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function AuditPage() {
  const listFn = useServerFn(listAuditLog);
  const [entity, setEntity] = useState<string>("all");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit-log", entity],
    queryFn: () => listFn({ data: { limit: 300, ...(entity !== "all" ? { entityType: entity } : {}) } }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Registro de auditoría</h1>
          <p className="text-sm text-muted-foreground">
            Últimos {rows.length} eventos registrados en el panel.
          </p>
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="product">Productos</SelectItem>
            <SelectItem value="content_block">Contenido</SelectItem>
            <SelectItem value="promotion">Promociones</SelectItem>
            <SelectItem value="site_setting">Ajustes / SEO</SelectItem>
            <SelectItem value="batch">Lotes</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
