import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Package, Eye, MessageCircle, Scissors, AlertTriangle, Star, Copy } from "lucide-react";
import { toast } from "sonner";
import { getDashboardStats } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

const BLOQUES_COOPGBD = [
  {
    titulo: "A) Caja incrustada (se ve la página dentro de coopgbd.com)",
    codigo:
      '<iframe src="https://gbdmarket.lovable.app/?embed=1" title="Mueblería GBD" loading="lazy" style="width:100%;height:900px;border:0;border-radius:16px"></iframe>',
  },
  {
    titulo: "B) Botón o ítem de menú (lo más simple)",
    codigo: "Texto: Mueblería GBD  →  https://gbdmarket.lovable.app",
  },
  {
    titulo: "C) Subdominio propio (la opción más profesional)",
    codigo: "muebleria.coopgbd.com  →  se conecta en Project settings > Domains",
  },
];

function BloqueCodigo({ titulo, codigo }: { titulo: string; codigo: string }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar; selecciónalo manualmente");
    }
  };
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{titulo}</p>
        <Button size="sm" variant="outline" onClick={copiar} className="shrink-0">
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
        </Button>
      </div>
      <pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-2.5 text-xs text-muted-foreground">{codigo}</pre>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: any; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-display font-bold text-foreground">{value}</div>
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-md ${accent ?? "bg-primary-soft text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de actividad del catálogo y solicitudes.</p>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="h-24 animate-pulse" /></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Productos" value={data.products} icon={Package} />
            <Stat label="Publicados" value={data.published} icon={Eye} accent="bg-success/10 text-success" />
            <Stat label="Destacados" value={data.featured} icon={Star} accent="bg-accent/15 text-accent-foreground" />
            <Stat label="Stock bajo (≤2)" value={data.lowStock} icon={AlertTriangle} accent="bg-destructive/10 text-destructive" />
            <Stat label="Bordados (total)" value={data.embroideryTotal} icon={Scissors} />
            <Stat label="Bordados nuevos" value={data.embroideryNew} icon={Scissors} accent="bg-warning/10 text-warning" />
            <Stat label="WhatsApp 30d" value={data.whatsappLeads30d} icon={MessageCircle} accent="bg-success/10 text-success" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos más vistos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topViewed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay vistas registradas.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.topViewed.map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.brand ?? "—"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.views_count} vistas · {p.quote_count} cotizaciones
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Insertar en coopgbd.com</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Copia la opción que prefieras y envíasela a quien administra el sitio web de la cooperativa.
          </p>
          {BLOQUES_COOPGBD.map((b) => (
            <BloqueCodigo key={b.titulo} titulo={b.titulo} codigo={b.codigo} />
          ))}
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>La caja incrustada no cuenta como contenido de coopgbd.com para Google; el subdominio propio sí.</li>
            <li>Dentro de una caja no se puede instalar la app en el teléfono.</li>
            <li>El subdominio requiere plan de pago y que se agregue un registro de dominio apuntando a esta app.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
