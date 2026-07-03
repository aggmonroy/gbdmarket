import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPendingDrafts } from "@/lib/drafts.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/preview")({
  component: PreviewPage,
});

const LABELS: Record<string, string> = {
  product: "Producto",
  content_block: "Contenido",
  promotion: "Promoción",
  site_setting: "Ajuste",
};

function PreviewPage() {
  const listFn = useServerFn(listPendingDrafts);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pending-drafts-preview"],
    queryFn: () => listFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Vista previa de borradores</h1>
        <p className="text-sm text-muted-foreground">
          Estos son los cambios que se aplicarán al sitio cuando publiques. El sitio público no los muestra todavía.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          No hay borradores pendientes. Activa el modo borrador en el panel para crear cambios sin publicar.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {items.map((it: any) => (
            <Card key={`${it.entity_type}-${it.entity_id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">{LABELS[it.entity_type] ?? it.entity_type}</Badge>
                  <span>{it.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-2 text-sm sm:grid-cols-[180px_1fr]">
                  {Object.entries(it.draft ?? {}).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground font-medium">{k}</dt>
                      <dd className="break-words">
                        {typeof v === "object" ? (
                          <pre className="text-xs bg-muted/40 p-2 rounded overflow-x-auto">{JSON.stringify(v, null, 2)}</pre>
                        ) : (
                          String(v ?? "—")
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
