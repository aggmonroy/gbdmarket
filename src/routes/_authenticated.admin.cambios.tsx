import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Rocket, Trash2, Eye } from "lucide-react";
import {
  listPendingDrafts,
  publishDraft,
  discardDraft,
  publishAllDrafts,
} from "@/lib/drafts.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/cambios")({
  component: PendingChangesPage,
});

const LABELS: Record<string, string> = {
  product: "Producto",
  content_block: "Contenido",
  promotion: "Promoción",
  site_setting: "Ajuste",
};

function PendingChangesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPendingDrafts);
  const pubFn = useServerFn(publishDraft);
  const discFn = useServerFn(discardDraft);
  const pubAllFn = useServerFn(publishAllDrafts);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pending-drafts"],
    queryFn: () => listFn(),
  });

  async function publish(entity_type: string, entity_id: string) {
    try {
      await pubFn({ data: { entity_type: entity_type as any, entity_id } });
      toast.success("Publicado");
      qc.invalidateQueries({ queryKey: ["pending-drafts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function discard(entity_type: string, entity_id: string) {
    if (!confirm("¿Descartar el borrador?")) return;
    try {
      await discFn({ data: { entity_type: entity_type as any, entity_id } });
      toast.success("Borrador descartado");
      qc.invalidateQueries({ queryKey: ["pending-drafts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function publishAll() {
    if (!confirm(`¿Publicar los ${items.length} cambios pendientes?`)) return;
    try {
      const res = await pubAllFn();
      toast.success(`${res.published} cambios publicados`);
      qc.invalidateQueries({ queryKey: ["pending-drafts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Cambios pendientes</h1>
          <p className="text-sm text-muted-foreground">
            Borradores guardados que aún no se reflejan en el sitio público.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/admin/preview" target="_blank" rel="noreferrer">
              <Eye className="mr-2 h-4 w-4" /> Vista previa
            </a>
          </Button>
          <Button onClick={publishAll} disabled={items.length === 0}>
            <Rocket className="mr-2 h-4 w-4" /> Publicar todo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cambios pendientes. Los cambios que guardes en modo borrador aparecerán aquí.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it: any) => (
                <li key={`${it.entity_type}-${it.entity_id}`} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{LABELS[it.entity_type] ?? it.entity_type}</Badge>
                      <span className="font-medium truncate">{it.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Actualizado: {new Date(it.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => discard(it.entity_type, it.entity_id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Descartar
                    </Button>
                    <Button size="sm" onClick={() => publish(it.entity_type, it.entity_id)}>
                      <Rocket className="mr-1 h-3.5 w-3.5" /> Publicar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
