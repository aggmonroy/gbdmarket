import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getUsageReport, getUsageHistorico } from "@/lib/analytics.functions";
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
  const historicoFn = useServerFn(getUsageHistorico);
  const [meses, setMeses] = useState(12);
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

  const { data: hist } = useQuery({
    queryKey: ["usage-historico", meses],
    queryFn: () => historicoFn({ data: { meses } }),
  });

  const totals = data?.by_type ?? {};

  const descargarCSV = () => {
    const filas = hist?.mensual ?? [];
    if (!filas.length) return;
    const cab = [
      "Mes", "Visitas", "Personas (sesiones)", "Clics WhatsApp/Cotizar", "Formularios",
      "Instalaciones app", "Aperturas app", "Invitaciones", "Rechazos",
    ];
    const csv = [
      cab.join(","),
      ...filas.map((f: any) =>
        [f.mes, f.vistas, f.sesiones, f.whatsapp, f.formularios, f.instalaciones, f.aperturas, f.invitaciones, f.rechazos].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `uso-gbd-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <CardHeader className="pb-2"><CardTitle className="text-base">Resumen para la gerencia</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <p>
                En el período consultado <b>{(data.unique_sessions ?? 0).toLocaleString("es-PA")}</b> personas
                distintas visitaron el sitio y generaron <b>{(totals.page_view ?? 0).toLocaleString("es-PA")}</b> visitas
                a páginas.
              </p>
              <p>
                <b>{(data.pwa?.installs ?? 0).toLocaleString("es-PA")}</b> instalaron la aplicación en su teléfono
                y se abrió <b>{(data.pwa?.launches ?? 0).toLocaleString("es-PA")}</b> veces como app instalada.
                Se mostró la invitación a instalar <b>{(data.pwa?.prompts ?? 0).toLocaleString("es-PA")}</b> veces
                {(data.pwa?.prompts ?? 0) > 0 && (
                  <> (aceptación del {(((data.pwa?.installs ?? 0) / (data.pwa?.prompts || 1)) * 100).toFixed(0)}%)</>
                )}
                .
              </p>
              <p>
                Contactos generados: <b>{((totals.whatsapp_click ?? 0) + (totals.quote_click ?? 0)).toLocaleString("es-PA")}</b> clics
                a WhatsApp o cotización y <b>{(totals.form_submit ?? 0).toLocaleString("es-PA")}</b> formularios enviados.
              </p>
            </CardContent>
          </Card>

          {(data.pwa_por_plataforma?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Instalaciones por tipo de teléfono</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {data.pwa_por_plataforma.map((p: any) => (
                    <li key={p.plataforma} className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5">
                      <span>{p.plataforma}</span>
                      <Badge variant="secondary">{p.total}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-base">Histórico mensual</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={String(meses)} onValueChange={(v) => setMeses(Number(v))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Últimos 6 meses</SelectItem>
                    <SelectItem value="12">Últimos 12 meses</SelectItem>
                    <SelectItem value="24">Últimos 24 meses</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={descargarCSV}>Descargar Excel/CSV</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(hist?.mensual?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay histórico disponible.</p>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hist!.mensual}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="mes" fontSize={11} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="instalaciones" name="Instalaciones" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="aperturas" name="Aperturas como app" fill="#22c55e" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="sesiones" name="Personas" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="py-2">Mes</th>
                          <th className="py-2 text-right">Personas</th>
                          <th className="py-2 text-right">Visitas</th>
                          <th className="py-2 text-right">WhatsApp/Cotizar</th>
                          <th className="py-2 text-right">Formularios</th>
                          <th className="py-2 text-right">Instalaciones</th>
                          <th className="py-2 text-right">Aperturas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hist!.mensual.map((f: any) => (
                          <tr key={f.mes} className="border-b border-border/50">
                            <td className="py-1.5">{f.mes}</td>
                            <td className="py-1.5 text-right">{f.sesiones}</td>
                            <td className="py-1.5 text-right">{f.vistas}</td>
                            <td className="py-1.5 text-right">{f.whatsapp}</td>
                            <td className="py-1.5 text-right">{f.formularios}</td>
                            <td className="py-1.5 text-right">{f.instalaciones}</td>
                            <td className="py-1.5 text-right">{f.aperturas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
