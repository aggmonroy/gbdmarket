/**
 * Vista tipo dashboard del informe mensual. Se usa tanto para la consulta
 * interactiva como para la versión imprimible (con secciones seleccionadas).
 */
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MESES_PERIODO,
  TRIMESTRES,
  VENDEDORES,
  bal,
  fmt,
  infoPeriodo,
  mesesDelPeriodoFiscal,
  pct,
  sinItbms,
  type InformeMensual,
  type SeccionId,
} from "@/lib/informes-shared";

type SerieFila = { serie: string; periodo: string; datos: Record<string, number> };

const COLORES = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3, 200 70% 45%))", "#6b7280", "#f59e0b", "#10b981"];

function Seccion({
  id,
  titulo,
  visible,
  children,
}: {
  id: SeccionId;
  titulo: string;
  visible: Set<SeccionId> | null;
  children: React.ReactNode;
}) {
  if (visible && !visible.has(id)) return null;
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <CardTitle className="text-base uppercase tracking-wide">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

function Tabla({ head, rows, foot }: { head: string[]; rows: (string | number)[][]; foot?: (string | number)[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-muted/60">
            {head.map((h) => (
              <th key={h} className="border border-border px-2 py-1.5 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-muted/20">
              {r.map((c, j) => (
                <td key={j} className={`border border-border px-2 py-1 ${j === 0 ? "" : "text-right tabular-nums"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {foot && (
            <tr className="bg-primary/10 font-semibold">
              {foot.map((c, j) => (
                <td key={j} className={`border border-border px-2 py-1 ${j === 0 ? "" : "text-right tabular-nums"}`}>
                  {c}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold tabular-nums">{valor}</div>
      {nota && <div className="text-[11px] text-muted-foreground">{nota}</div>}
    </div>
  );
}

export function DashboardInforme({
  informe,
  series,
  secciones,
  imprimible = false,
}: {
  informe: InformeMensual;
  series: SerieFila[];
  secciones?: SeccionId[];
  imprimible?: boolean;
}) {
  const visible = secciones ? new Set(secciones) : null;
  const d = informe.datos ?? {};
  const f = d.repfacmes;
  const { mesNombre, anio, periodoFiscal, inicioFiscal } = infoPeriodo(informe.periodo);
  const meses = useMemo(() => mesesDelPeriodoFiscal(inicioFiscal), [inicioFiscal]);

  const serie = (id: string) =>
    Object.fromEntries(series.filter((s) => s.serie === id).map((s) => [s.periodo, s.datos]));
  const ventasSerie = serie("ventas_historicas");
  const cobrosSerie = serie("cobros_historicos");
  const nuevosSerie = serie("clientes_nuevos");
  const igSerie = serie("instagram");

  const mensuales = meses.map((m) => ({
    mes: m.nombre.slice(0, 3),
    periodo: m.periodo,
    contado: ventasSerie[m.periodo]?.contado ?? 0,
    credito: ventasSerie[m.periodo]?.credito ?? 0,
    total: ventasSerie[m.periodo]?.total ?? 0,
    cobros: cobrosSerie[m.periodo]?.total ?? 0,
  }));
  const acum = mensuales.reduce(
    (a, m) => ({ contado: a.contado + m.contado, credito: a.credito + m.credito, total: a.total + m.total, cobros: a.cobros + m.cobros }),
    { contado: 0, credito: 0, total: 0, cobros: 0 },
  );

  const aniosNuevos = [...new Set(Object.keys(nuevosSerie).map((p) => p.slice(0, 4)))].sort();
  const aniosIg = [...new Set(Object.keys(igSerie).map((p) => p.slice(0, 4)))].sort();

  const trimestres = TRIMESTRES.map((t) => ({
    nombre: t.nombre,
    abonos: t.meses.reduce((s, n) => {
      const p = meses.find((m) => m.nombre === n)?.periodo ?? "";
      return s + (cobrosSerie[p]?.total ?? 0);
    }, 0),
  }));

  const igChart = aniosIg.length
    ? MESES_NOMBRE_CORTO.map((m, i) => {
        const fila: any = { mes: m };
        for (const a of aniosIg) {
          const p = `${a}-${String(i + 1).padStart(2, "0")}`;
          if (igSerie[p]?.linea_blanca) fila[`LB ${a}`] = igSerie[p]!.linea_blanca;
          if (igSerie[p]?.bordados) fila[`BD ${a}`] = igSerie[p]!.bordados;
        }
        return fila;
      })
    : [];

  return (
    <div className={`space-y-4 ${imprimible ? "print:space-y-3" : ""}`}>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Informe mensual · Línea Blanca y Bordados</div>
        <h2 className="font-display text-xl font-bold">
          {mesNombre} {anio}
        </h2>
        <p className="text-xs text-muted-foreground">
          Período fiscal {periodoFiscal} · {informe.estado === "generado" ? "Informe generado" : "Borrador"}
          {informe.generado_en ? ` · ${new Date(informe.generado_en).toLocaleString("es-PA")}` : ""}
        </p>
      </div>

      <Seccion id="ventas" titulo="1. Ventas del mes y crecimiento de cartera" visible={visible}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Ventas totales (con ITBMS)" valor={bal(f?.totales.total_con)} nota={`${bal(f?.totales.total_sin)} antes del 7%`} />
          <Kpi label="Al contado" valor={bal(f?.totales.contado_con)} nota={`${bal(f?.totales.contado_sin)} antes del 7%`} />
          <Kpi label="Al crédito" valor={bal(f?.totales.credito_con)} nota={`${bal(f?.totales.credito_sin)} antes del 7%`} />
        </div>
        <Tabla
          head={["Concepto", "Antes del 7% ITBMS", "ITBMS", "Con ITBMS"]}
          rows={[
            ["Al contado", bal(f?.totales.contado_sin), bal((f?.totales.contado_con ?? 0) - (f?.totales.contado_sin ?? 0)), bal(f?.totales.contado_con)],
            ["Al crédito", bal(f?.totales.credito_sin), bal((f?.totales.credito_con ?? 0) - (f?.totales.credito_sin ?? 0)), bal(f?.totales.credito_con)],
          ]}
          foot={["Total", bal(f?.totales.total_sin), bal(f?.totales.itbms), bal(f?.totales.total_con)]}
        />
        {informe.narrativa?.ventas && <p className="leading-relaxed">{informe.narrativa.ventas}</p>}
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Abonos del mes" valor={bal(f?.abonos_total)} nota={`${f?.abonos.length ?? 0} recibos`} />
          <Kpi label="Acumulado del período" valor={bal(acum.total)} nota={`${bal(sinItbms(acum.total))} antes del 7%`} />
          <Kpi label="Cobros del período" valor={bal(acum.cobros)} />
        </div>
      </Seccion>

      <Seccion id="vendedores" titulo="Ventas por vendedor" visible={visible}>
        <Tabla
          head={["Cód.", "Vendedor", "Contado", "Crédito", "Total"]}
          rows={(f?.por_vendedor ?? []).map((v) => [v.codigo, VENDEDORES[v.codigo] ?? v.nombre, bal(v.contado), bal(v.credito), bal(v.total)])}
          foot={[
            "",
            "Total",
            bal(f?.totales.contado_con),
            bal(f?.totales.credito_con),
            bal(f?.totales.total_con),
          ]}
        />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(f?.por_vendedor ?? []).map((v) => ({ nombre: (VENDEDORES[v.codigo] ?? v.nombre).split("//").pop()!.trim(), Contado: v.contado, Crédito: v.credito }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" fontSize={10} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(v: any) => bal(Number(v))} />
              <Legend />
              <Bar dataKey="Contado" fill={COLORES[0]} />
              <Bar dataKey="Crédito" fill={COLORES[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Seccion>

      <Seccion id="mensuales" titulo={`Ventas mensuales del período ${periodoFiscal} (en balboas)`} visible={visible}>
        <Tabla
          head={["Mes", "Contado", "Crédito", "Total"]}
          rows={mensuales.map((m) => [m.periodo, bal(m.contado), bal(m.credito), bal(m.total)])}
          foot={["Total", bal(acum.contado), bal(acum.credito), bal(acum.total)]}
        />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mensuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(v: any) => bal(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="total" name="Ventas" stroke={COLORES[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="cobros" name="Cobros" stroke={COLORES[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Seccion>

      <Seccion id="lineas" titulo="Ventas por línea de negocio" visible={visible}>
        {d.lineas?.length ? (
          <>
            <Tabla
              head={["Línea", "Unidades", "Ventas", "Ganancia"]}
              rows={d.lineas.map((l) => [l.linea, fmt(l.unidades), bal(l.ventas), bal(l.ganancia)])}
              foot={[
                "Total",
                fmt(d.lineas.reduce((s, l) => s + l.unidades, 0)),
                bal(d.lineas.reduce((s, l) => s + l.ventas, 0)),
                bal(d.lineas.reduce((s, l) => s + l.ganancia, 0)),
              ]}
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.lineas} dataKey="ventas" nameKey="linea" outerRadius={80} label={(e: any) => e.linea}>
                    {d.lineas.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => bal(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPARTVEN para ver esta sección.</p>
        )}
      </Seccion>

      <Seccion id="rotacion" titulo="Rotación de productos · Top 10 categorías" visible={visible}>
        {d.rotacion?.length ? (
          <div className="space-y-2">
            {d.rotacion.map((c, i) => (
              <div key={c.categoria} className="rounded-md border border-border p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">
                    {i + 1}. {c.categoria}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(c.unidades)} unidades · {bal(c.ventas)}
                  </div>
                </div>
                <Tabla
                  head={["Modelo / código", "Descripción", "Unid.", "Ventas"]}
                  rows={c.modelos.map((m) => [m.codigo, m.descripcion, fmt(m.unidades), bal(m.ventas)])}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPARTVEN para ver la rotación.</p>
        )}
      </Seccion>

      <Seccion id="historicas" titulo="Cuadro comparativo de ventas históricas de la mueblería" visible={visible}>
        <Tabla
          head={["Mes", ...aniosVentas(ventasSerie)]}
          rows={MESES_PERIODO.map((n, i) => {
            const mesNum = i < 5 ? 8 + i : i - 4;
            return [
              n,
              ...aniosVentas(ventasSerie).map((a) => {
                const anioReal = i < 5 ? Number(a.split("-")[0]) : Number(a.split("-")[1] ?? a);
                return bal(ventasSerie[`${anioReal}-${String(mesNum).padStart(2, "0")}`]?.total ?? 0);
              }),
            ];
          })}
          foot={[
            "Total",
            ...aniosVentas(ventasSerie).map((a) => {
              const inicio = Number(a.split("-")[0]);
              return bal(
                mesesDelPeriodoFiscal(inicio).reduce((s, m) => s + (ventasSerie[m.periodo]?.total ?? 0), 0),
              );
            }),
          ]}
        />
      </Seccion>

      <Seccion id="clientes_nuevos" titulo="Cuadro comparativo de clientes nuevos históricos" visible={visible}>
        {aniosNuevos.length ? (
          <>
            <Tabla
              head={["Mes", ...aniosNuevos]}
              rows={MESES_NOMBRE_CORTO.map((m, i) => [
                m,
                ...aniosNuevos.map((a) => fmt(nuevosSerie[`${a}-${String(i + 1).padStart(2, "0")}`]?.clientes ?? 0)),
              ])}
              foot={[
                "Total",
                ...aniosNuevos.map((a) =>
                  fmt(
                    Object.entries(nuevosSerie)
                      .filter(([p]) => p.startsWith(a))
                      .reduce((s, [, v]) => s + (v.clientes ?? 0), 0),
                  ),
                ),
              ]}
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MESES_NOMBRE_CORTO.map((m, i) => {
                    const fila: any = { mes: m };
                    for (const a of aniosNuevos) fila[a] = nuevosSerie[`${a}-${String(i + 1).padStart(2, "0")}`]?.clientes ?? 0;
                    return fila;
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  {aniosNuevos.map((a, i) => (
                    <Bar key={a} dataKey={a} fill={COLORES[i % COLORES.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Registra los clientes nuevos por mes en “Datos históricos”.</p>
        )}
      </Seccion>

      <Seccion id="instagram" titulo="Seguidores en Instagram · Línea Blanca y Bordados" visible={visible}>
        {aniosIg.length ? (
          <>
            <Tabla
              head={["Mes", ...aniosIg.flatMap((a) => [`LB ${a}`, `Bordados ${a}`])]}
              rows={MESES_NOMBRE_CORTO.map((m, i) => [
                m,
                ...aniosIg.flatMap((a) => {
                  const p = `${a}-${String(i + 1).padStart(2, "0")}`;
                  return [fmt(igSerie[p]?.linea_blanca ?? 0), fmt(igSerie[p]?.bordados ?? 0)];
                }),
              ])}
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={igChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(igChart[0] ?? {})
                    .filter((k) => k !== "mes")
                    .map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={COLORES[i % COLORES.length]} strokeWidth={2} />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Carga una captura de estadísticas de Instagram en “Datos históricos”.</p>
        )}
      </Seccion>

      <Seccion id="cxc" titulo="2. Recuperación de cuentas por cobrar" visible={visible}>
        <div className="grid gap-2 sm:grid-cols-4">
          <Kpi label="Saldo mes anterior" valor={bal(d.cxc?.saldo_mes_anterior)} />
          <Kpi label="Ventas al crédito" valor={bal(d.cxc?.ventas_credito)} />
          <Kpi label="Abonos del mes" valor={bal(d.cxc?.abonos)} />
          <Kpi label="Saldo de cartera" valor={bal(d.cxc?.saldo_mes_actual)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Morosidad total" valor={bal(d.cxc?.morosidad_total)} />
          <Kpi label="Cuentas al corriente" valor={bal(d.cxc?.cxc_corriente)} />
          <Kpi
            label="Recuperación sobre cartera"
            valor={pct((d.cxc?.abonos ?? 0) / Math.max(d.cxc?.saldo_mes_actual ?? 1, 1))}
          />
        </div>
        {informe.narrativa?.recuperacion && <p className="leading-relaxed">{informe.narrativa.recuperacion}</p>}
      </Seccion>

      <Seccion id="morosidad" titulo="Morosidad vencida y no vencida por plazos" visible={visible}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Morosidad vencida</div>
            <Tabla
              head={["Plazo", "Monto"]}
              rows={Object.entries(d.morosidad?.vencida.plazos ?? {}).map(([k, v]) => [k, bal(v)])}
              foot={["Total", bal(d.morosidad?.vencida.total)]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Morosidad no vencida</div>
            <Tabla
              head={["Plazo", "Monto"]}
              rows={Object.entries(d.morosidad?.no_vencida.plazos ?? {}).map(([k, v]) => [k, bal(v)])}
              foot={["Total", bal(d.morosidad?.no_vencida.total)]}
            />
          </div>
        </div>
      </Seccion>

      <Seccion id="abonos" titulo="Abonos realizados mensual y trimestral" visible={visible}>
        <Tabla
          head={["Mes", "Abonos"]}
          rows={mensuales.map((m) => [m.periodo, bal(m.cobros)])}
          foot={["Total", bal(acum.cobros)]}
        />
        <Tabla head={["Trimestre", "Abonos"]} rows={trimestres.map((t) => [t.nombre, bal(t.abonos)])} />
        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Recibos de pagos diarios · total de cobros por cajero
        </div>
        <Tabla
          head={["Cajero", "Recibos", "Total cobrado"]}
          rows={(f?.por_cajero ?? []).map((c) => [c.nombre, fmt(c.recibos), bal(c.total)])}
          foot={["Total", fmt((f?.por_cajero ?? []).reduce((s, c) => s + c.recibos, 0)), bal(f?.abonos_total)]}
        />
      </Seccion>

      <Seccion id="compras" titulo="Compras del mes e indicadores" visible={visible}>
        {d.compras ? (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <Kpi label="Compras del mes" valor={bal(d.compras.total)} nota={`${d.compras.compras.length} documentos`} />
              <Kpi
                label="Compras / ventas (antes ITBMS)"
                valor={pct(d.compras.total / Math.max(f?.totales.total_sin ?? 1, 1))}
              />
              <Kpi
                label="Compra promedio"
                valor={bal(d.compras.total / Math.max(d.compras.compras.length, 1))}
              />
            </div>
            <Tabla
              head={["Fecha", "Documento", "Proveedor", "Monto"]}
              rows={d.compras.compras.slice(0, 40).map((c) => [c.fecha, c.documento, c.proveedor, bal(c.monto)])}
              foot={["", "", "Total", bal(d.compras.total)]}
            />
          </>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPCOMPFCH para registrar las compras del mes.</p>
        )}
      </Seccion>

      <Seccion id="alertas" titulo="Alertas de contabilidad" visible={visible}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Cuentas con saldo" valor={fmt(d.repclientes?.cuentas)} />
          <Kpi label="Saldo total de clientes" valor={bal(d.repclientes?.total_saldo)} />
          <Kpi label="Situaciones a revisar" valor={fmt(d.repclientes?.alertas.length ?? 0)} />
        </div>
        {d.repclientes?.alertas.length ? (
          <div className="space-y-1">
            {d.repclientes.alertas.map((a, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <div className="text-sm font-medium">
                    {a.cliente} <Badge variant="outline">{a.tipo.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{informe.narrativa?.alertas ?? "Sin alertas registradas."}</p>
        )}
      </Seccion>

      <Seccion id="conversion" titulo="Conversión de cotizaciones en ventas" visible={visible}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Cotizaciones del sitio" valor={fmt(d.conversion?.cotizaciones)} />
          <Kpi label="Convertidas en factura" valor={fmt(d.conversion?.convertidas)} />
          <Kpi label="Tasa de conversión" valor={pct(d.conversion?.tasa)} />
        </div>
        {d.conversion?.detalle.length ? (
          <Tabla
            head={["Cliente", "Cotización", "Factura", "Monto"]}
            rows={d.conversion.detalle.map((c) => [c.cliente, c.cotizacion, c.factura ?? "—", c.monto ? bal(c.monto) : "—"])}
          />
        ) : (
          <p className="text-muted-foreground">No hubo cotizaciones del sitio en el mes.</p>
        )}
      </Seccion>

      <Seccion id="gestion" titulo="3. Informe de gestión operativa" visible={visible}>
        {informe.gestion?.general && <p className="leading-relaxed">{informe.gestion.general}</p>}
        {(informe.gestion?.colaboradores ?? []).map((c) => (
          <div key={c.nombre} className="rounded-md border border-border p-3">
            <div className="text-sm font-semibold">{c.nombre}</div>
            <p className="mt-1 whitespace-pre-line leading-relaxed">{c.texto_ia}</p>
            {c.texto_manual && <p className="mt-2 whitespace-pre-line leading-relaxed">{c.texto_manual}</p>}
          </div>
        ))}
        {!(informe.gestion?.colaboradores ?? []).length && (
          <p className="text-muted-foreground">Genera el informe para redactar la gestión operativa del mes.</p>
        )}
      </Seccion>
    </div>
  );
}

const MESES_NOMBRE_CORTO = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/** Períodos fiscales con datos registrados, en orden. */
function aniosVentas(ventasSerie: Record<string, any>) {
  const inicios = new Set<number>();
  for (const p of Object.keys(ventasSerie)) {
    const [a, m] = p.split("-").map(Number);
    inicios.add((m ?? 1) >= 8 ? a! : a! - 1);
  }
  return [...inicios].sort().map((i) => `${i}-${i + 1}`);
}
