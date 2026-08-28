import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUsageReport } from "@/lib/analytics.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/reportes")({
  component: ReportsPage,
});

function ReportsPage() {
  const reportFn = useServerFn(getUsageReport);
  const [days, setDays] = useState(30);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const usaRango = Boolean(desde || hasta);
  const { data, isLoading } = useQuery({
    queryKey: ["usage-report", days, desde, hasta],
    queryFn: () =>
      reportFn({
        data: usaRango
          ? { desde: desde || undefined, hasta: hasta || undefined }
          : { days },
      }),
  });

  const totals = data?.by_type ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Reporte de uso del sitio</h1>
          <p className="text-sm text-muted-foreground">
            Interacciones anónimas del sitio público.{" "}
            {usaRango ? `Del ${data?.desde ?? desde} al ${data?.hasta ?? hasta}.` : `Últimos ${days} días.`}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select value={String(days)} onValueChange={(v) => { setDays(Number(v)); setDesde(""); setHasta(""); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="14">Últimos 14 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="60">Últimos 60 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <label className="block text-[11px] text-muted-foreground">Desde</label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-[9.5rem]" />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground">Hasta</label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-[9.5rem]" />
          </div>
          {usaRango && (
            <Button variant="outline" size="sm" onClick={() => { setDesde(""); setHasta(""); }}>
              Limpiar
            </Button>
          )}
        </div>
      </div>


      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !data ? null : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Interacciones totales" value={data.total_events} />
            <StatCard title="Sesiones únicas" value={data.unique_sessions} />
            <StatCard title="Vistas de página" value={totals.page_view ?? 0} />
            <StatCard title="Clics WhatsApp / Cotizar" value={(totals.whatsapp_click ?? 0) + (totals.quote_click ?? 0)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Instalaciones de la app" value={data.pwa?.installs ?? 0} />
            <StatCard title="Aperturas como app" value={data.pwa?.launches ?? 0} />
            <StatCard title="Invitaciones mostradas" value={data.pwa?.prompts ?? 0} />
            <StatCard title="Instalación rechazada" value={data.pwa?.dismissed ?? 0} />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">App: instalaciones, aperturas e invitaciones por día</CardTitle></CardHeader>
            <CardContent className="h-72">
              {(data.pwa_timeseries?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos de la app en este rango.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.pwa_timeseries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="installs" name="Instalaciones" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="launches" name="Aperturas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="prompts" name="Invitaciones" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="dismissed" name="Rechazos" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">App por página</CardTitle></CardHeader>
            <CardContent>
              {(data.pwa_by_page?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos de la app en este rango.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-2">Página</th>
                        <th className="py-2 text-right">Instalaciones</th>
                        <th className="py-2 text-right">Aperturas</th>
                        <th className="py-2 text-right">Invitaciones</th>
                        <th className="py-2 text-right">Rechazos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pwa_by_page.map((r: any) => (
                        <tr key={r.path} className="border-b border-border/50">
                          <td className="py-1.5 max-w-[16rem] truncate">{r.path}</td>
                          <td className="py-1.5 text-right">{r.installs}</td>
                          <td className="py-1.5 text-right">{r.launches}</td>
                          <td className="py-1.5 text-right">{r.prompts}</td>
                          <td className="py-1.5 text-right">{r.dismissed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>



          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tráfico diario</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" name="Vistas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="unique_sessions" name="Sesiones" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="whatsapp" name="WhatsApp/Cotizar" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="forms" name="Formularios" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Páginas más visitadas</CardTitle></CardHeader>
              <CardContent>
                {data.top_pages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos aún.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {data.top_pages.map((p: any) => (
                      <li key={p.path} className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5">
                        <span className="truncate">{p.path}</span>
                        <Badge variant="secondary">{p.count}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Productos más vistos</CardTitle></CardHeader>
              <CardContent>
                {data.top_products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos aún.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {data.top_products.map((p: any) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5">
                        <span className="truncate">{p.name}</span>
                        <Badge variant="secondary">{p.count}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cuellos de botella detectados</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <Bottleneck data={data} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-bold">{value.toLocaleString("es-PA")}</div>
      </CardContent>
    </Card>
  );
}

function Bottleneck({ data }: { data: any }) {
  const items: string[] = [];
  const views = data.by_type?.page_view ?? 0;
  const productViews = data.by_type?.product_view ?? 0;
  const wa = (data.by_type?.whatsapp_click ?? 0) + (data.by_type?.quote_click ?? 0);
  const forms = data.by_type?.form_submit ?? 0;

  if (views > 0) {
    const rate = ((wa + forms) / views) * 100;
    items.push(`Tasa de conversión (WhatsApp/formularios sobre vistas): ${rate.toFixed(1)}%.`);
    if (rate < 1.5) items.push("⚠️ Baja conversión: revisa CTAs, tiempo de carga o visibilidad del botón de WhatsApp.");
  }
  if (productViews > 0 && wa === 0) {
    items.push("⚠️ Los usuarios ven productos pero no cotizan. Considera un CTA más visible en la ficha.");
  }
  if (data.top_pages[0] && data.top_pages[0].count > views * 0.7) {
    items.push(`⚠️ El tráfico se concentra en ${data.top_pages[0].path}. Diversifica con más contenido / SEO en otras rutas.`);
  }
  if (items.length === 0) items.push("Sin cuellos de botella evidentes con los datos actuales.");
  return <ul className="list-disc pl-5 space-y-1">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
}
