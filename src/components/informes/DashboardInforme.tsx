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
  ComposedChart,
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
  bal,
  fmt,
  infoPeriodo,
  mesesDelPeriodoFiscal,
  nombreVendedor,
  pct,
  sinItbms,
  type InformeMensual,
  type SeccionId,
} from "@/lib/informes-shared";

type SerieFila = { serie: string; periodo: string; datos: Record<string, number> };

/** Paleta alineada a los tokens de la página (azul institucional + apoyos). */
const COLORES = [
  "var(--primary)",
  "var(--secondary)",
  "oklch(0.65 0.16 155)",
  "oklch(0.78 0.16 75)",
  "oklch(0.6 0.22 27)",
  "oklch(0.55 0.1 300)",
];

const ejeY = { fontSize: 10, tickFormatter: (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v)) };

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--card-foreground)",
    fontSize: 12,
  },
} as const;

function Grafico({ children, alto = 240 }: { children: React.ReactElement; alto?: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2" style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Seccion({
  id,
  titulo,
  descripcion,
  visible,
  children,
}: {
  id: SeccionId;
  titulo: string;
  descripcion?: string;
  visible: Set<SeccionId> | null;
  children: React.ReactNode;
}) {
  if (visible && !visible.has(id)) return null;
  return (
    <Card className="break-inside-avoid overflow-hidden border-border/70 shadow-soft">
      <CardHeader className="gap-1 border-b border-border/60 bg-muted/30 py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="h-4 w-1.5 rounded-full bg-gradient-primary" aria-hidden />
          {titulo}
        </CardTitle>
        {descripcion && <p className="pl-3.5 text-xs text-muted-foreground">{descripcion}</p>}
      </CardHeader>
      <CardContent className="space-y-4 pt-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function Tabla({ head, rows, foot }: { head: string[]; rows: (string | number)[][]; foot?: (string | number)[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[420px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-primary/8 text-primary">
            {head.map((h) => (
              <th key={h} className="px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/70 even:bg-muted/25">
              {r.map((c, j) => (
                <td key={j} className={`px-2.5 py-1.5 ${j === 0 ? "" : "text-right tabular-nums"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {foot && (
            <tr className="border-t-2 border-primary/30 bg-primary/10 font-semibold">
              {foot.map((c, j) => (
                <td key={j} className={`px-2.5 py-2 ${j === 0 ? "" : "text-right tabular-nums"}`}>
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

function Kpi({
  label,
  valor,
  nota,
  tono = "neutro",
}: {
  label: string;
  valor: string;
  nota?: string;
  tono?: "neutro" | "primario" | "positivo" | "alerta";
}) {
  const estilos = {
    neutro: "border-border bg-card",
    primario: "border-primary/25 bg-primary/8",
    positivo: "border-[oklch(0.65_0.16_155_/_0.35)] bg-[oklch(0.65_0.16_155_/_0.08)]",
    alerta: "border-destructive/30 bg-destructive/8",
  }[tono];
  return (
    <div className={`rounded-xl border p-3 break-inside-avoid ${estilos}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums leading-tight">{valor}</div>
      {nota && <div className="mt-0.5 text-[11px] text-muted-foreground">{nota}</div>}
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

  const vendedores = (f?.por_vendedor ?? []).map((v) => ({
    ...v,
    etiqueta: nombreVendedor(v.codigo, informe.periodo),
  }));

  return (
    <div className={`space-y-5 ${imprimible ? "print:space-y-3" : ""}`}>
      {/* Portada ejecutiva */}
      <div className="overflow-hidden rounded-2xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated print:rounded-none print:shadow-none">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-80">
              Informe mensual · Línea Blanca y Bordados GBD
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight">
              {mesNombre} {anio}
            </h2>
            <p className="text-xs opacity-80">
              Período fiscal {periodoFiscal} ·{" "}
              {informe.estado === "generado" ? "Informe generado" : "Borrador en construcción"}
              {informe.generado_en ? ` · ${new Date(informe.generado_en).toLocaleString("es-PA")}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            {[
              { l: "Ventas del mes", v: bal(f?.totales.total_con) },
              { l: "Abonos", v: bal(f?.abonos_total) },
              { l: "Morosidad", v: bal(d.morosidad?.vencida.total) },
            ].map((k) => (
              <div key={k.l} className="rounded-xl bg-primary-foreground/10 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider opacity-80">{k.l}</div>
                <div className="font-display text-sm font-bold tabular-nums">{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Seccion
        id="ventas"
        titulo="1. Ventas del mes y crecimiento de cartera"
        descripcion="Resumen de facturación al contado y al crédito, con y sin ITBMS."
        visible={visible}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi tono="primario" label="Ventas totales (con ITBMS)" valor={bal(f?.totales.total_con)} nota={`${bal(f?.totales.total_sin)} antes del 7%`} />
          <Kpi label="Al contado" valor={bal(f?.totales.contado_con)} nota={`${bal(f?.totales.contado_sin)} antes del 7%`} />
          <Kpi label="Al crédito" valor={bal(f?.totales.credito_con)} nota={`${bal(f?.totales.credito_sin)} antes del 7%`} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Tabla
            head={["Concepto", "Antes del 7% ITBMS", "ITBMS", "Con ITBMS"]}
            rows={[
              ["Al contado", bal(f?.totales.contado_sin), bal((f?.totales.contado_con ?? 0) - (f?.totales.contado_sin ?? 0)), bal(f?.totales.contado_con)],
              ["Al crédito", bal(f?.totales.credito_sin), bal((f?.totales.credito_con ?? 0) - (f?.totales.credito_sin ?? 0)), bal(f?.totales.credito_con)],
            ]}
            foot={["Total", bal(f?.totales.total_sin), bal(f?.totales.itbms), bal(f?.totales.total_con)]}
          />
          <Grafico alto={220}>
            <PieChart>
              <Pie
                data={[
                  { nombre: "Contado", valor: f?.totales.contado_con ?? 0 },
                  { nombre: "Crédito", valor: f?.totales.credito_con ?? 0 },
                ]}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
              >
                <Cell fill={COLORES[0]} />
                <Cell fill={COLORES[1]} />
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Legend />
            </PieChart>
          </Grafico>
        </div>
        {informe.narrativa?.ventas && (
          <p className="rounded-xl border border-border bg-muted/30 p-3 leading-relaxed">{informe.narrativa.ventas}</p>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi label="Abonos del mes" valor={bal(f?.abonos_total)} nota={`${f?.abonos.length ?? 0} recibos`} />
          <Kpi label="Acumulado del período" valor={bal(acum.total)} nota={`${bal(sinItbms(acum.total))} antes del 7%`} />
          <Kpi tono="positivo" label="Cobros del período" valor={bal(acum.cobros)} />
        </div>
      </Seccion>

      <Seccion
        id="vendedores"
        titulo="Ventas por vendedor"
        descripcion="Aporte de cada vendedor al total facturado del mes."
        visible={visible}
      >
        <Tabla
          head={["Cód.", "Vendedor", "Contado", "Crédito", "Total"]}
          rows={vendedores.map((v) => [v.codigo, v.etiqueta, bal(v.contado), bal(v.credito), bal(v.total)])}
          foot={[
            "",
            "Total",
            bal(f?.totales.contado_con),
            bal(f?.totales.credito_con),
            bal(f?.totales.total_con),
          ]}
        />
        <Grafico alto={260}>
          <BarChart
            data={vendedores.map((v) => ({
              nombre: v.etiqueta.split("//").pop()!.trim(),
              Contado: v.contado,
              Crédito: v.credito,
            }))}
            margin={{ top: 5, right: 8, bottom: 40, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="nombre" fontSize={9} interval={0} angle={-18} textAnchor="end" height={50} />
            <YAxis {...ejeY} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
            <Legend />
            <Bar dataKey="Contado" fill={COLORES[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Crédito" fill={COLORES[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Grafico>
      </Seccion>

      <Seccion
        id="mensuales"
        titulo={`Ventas mensuales del período ${periodoFiscal} (en balboas)`}
        descripcion="Evolución mes a mes de ventas y cobros del año fiscal agosto–julio."
        visible={visible}
      >
        <Grafico alto={260}>
          <ComposedChart data={mensuales} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" fontSize={10} />
            <YAxis {...ejeY} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
            <Legend />
            <Bar dataKey="contado" name="Contado" stackId="v" fill={COLORES[0]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="credito" name="Crédito" stackId="v" fill={COLORES[1]} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="cobros" name="Cobros" stroke={COLORES[2]} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </Grafico>
        <Tabla
          head={["Mes", "Contado", "Crédito", "Total"]}
          rows={mensuales.map((m) => [m.periodo, bal(m.contado), bal(m.credito), bal(m.total)])}
          foot={["Total", bal(acum.contado), bal(acum.credito), bal(acum.total)]}
        />
      </Seccion>

      <Seccion
        id="lineas"
        titulo="Ventas por línea de negocio"
        descripcion="Participación de cada línea en las ventas y la ganancia del mes."
        visible={visible}
      >
        {d.lineas?.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
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
            <Grafico alto={230}>
              <PieChart>
                <Pie data={d.lineas} dataKey="ventas" nameKey="linea" innerRadius={40} outerRadius={78} paddingAngle={3}>
                  {d.lineas.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
                <Legend />
              </PieChart>
            </Grafico>
          </div>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPARTVEN para ver esta sección.</p>
        )}
      </Seccion>

      <Seccion
        id="rotacion"
        titulo="Rotación de productos · Top 10 categorías"
        descripcion="Categorías con mayor movimiento y sus modelos más vendidos."
        visible={visible}
      >
        {d.rotacion?.length ? (
          <div className="space-y-3">
            <Grafico alto={Math.max(200, d.rotacion.length * 28 + 40)}>
              <BarChart
                layout="vertical"
                data={d.rotacion.map((c) => ({ categoria: c.categoria, Ventas: c.ventas }))}
                margin={{ top: 5, right: 12, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...ejeY} />
                <YAxis type="category" dataKey="categoria" width={110} fontSize={9} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
                <Bar dataKey="Ventas" fill={COLORES[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </Grafico>
            {d.rotacion.map((c, i) => (
              <div key={c.categoria} className="break-inside-avoid rounded-xl border border-border p-2.5">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">
                    {i + 1}. {c.categoria}
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {fmt(c.unidades)} unidades · {bal(c.ventas)}
                  </Badge>
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

      <Seccion
        id="cxc"
        titulo="2. Recuperación de cuentas por cobrar"
        descripcion="Movimiento de la cartera: saldo anterior + ventas al crédito − abonos."
        visible={visible}
      >
        <div className="grid gap-2 sm:grid-cols-4">
          <Kpi label="Saldo mes anterior" valor={bal(d.cxc?.saldo_mes_anterior)} />
          <Kpi label="Ventas al crédito" valor={bal(d.cxc?.ventas_credito)} />
          <Kpi tono="positivo" label="Abonos del mes" valor={bal(d.cxc?.abonos)} />
          <Kpi tono="primario" label="Saldo de cartera" valor={bal(d.cxc?.saldo_mes_actual)} />
        </div>
        <Grafico alto={230}>
          <BarChart
            data={[
              { etapa: "Saldo anterior", valor: d.cxc?.saldo_mes_anterior ?? 0 },
              { etapa: "+ Crédito", valor: d.cxc?.ventas_credito ?? 0 },
              { etapa: "− Abonos", valor: d.cxc?.abonos ?? 0 },
              { etapa: "Saldo actual", valor: d.cxc?.saldo_mes_actual ?? 0 },
            ]}
            margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="etapa" fontSize={10} />
            <YAxis {...ejeY} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
            <Bar dataKey="valor" name="Cartera" radius={[4, 4, 0, 0]}>
              {[COLORES[3], COLORES[1], COLORES[2], COLORES[0]].map((c, i) => (
                <Cell key={i} fill={c} />
              ))}
            </Bar>
          </BarChart>
        </Grafico>
        <div className="grid gap-2 sm:grid-cols-3">
          <Kpi tono="alerta" label="Morosidad total" valor={bal(d.cxc?.morosidad_total)} />
          <Kpi label="Cuentas al corriente" valor={bal(d.cxc?.cxc_corriente)} />
          <Kpi
            label="Recuperación sobre cartera"
            valor={pct((d.cxc?.abonos ?? 0) / Math.max(d.cxc?.saldo_mes_actual ?? 1, 1))}
          />
        </div>
        {informe.narrativa?.recuperacion && (
          <p className="rounded-xl border border-border bg-muted/30 p-3 leading-relaxed">{informe.narrativa.recuperacion}</p>
        )}
      </Seccion>

      <Seccion
        id="morosidad"
        titulo="Morosidad vencida y no vencida por plazos"
        descripcion="Distribución de la deuda por antigüedad de los plazos."
        visible={visible}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Kpi tono="alerta" label="Morosidad vencida" valor={bal(d.morosidad?.vencida.total)} />
          <Kpi label="Morosidad no vencida" valor={bal(d.morosidad?.no_vencida.total)} nota={`${fmt(d.morosidad?.no_vencida.cuentas)} cuentas`} />
        </div>
        <Grafico alto={230}>
          <BarChart
            data={[
              ...new Set([
                ...Object.keys(d.morosidad?.vencida.plazos ?? {}),
                ...Object.keys(d.morosidad?.no_vencida.plazos ?? {}),
              ]),
            ].map((p) => ({
              plazo: p,
              Vencida: d.morosidad?.vencida.plazos?.[p] ?? 0,
              "No vencida": d.morosidad?.no_vencida.plazos?.[p] ?? 0,
            }))}
            margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="plazo" fontSize={9} />
            <YAxis {...ejeY} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
            <Legend />
            <Bar dataKey="Vencida" fill={COLORES[4]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="No vencida" fill={COLORES[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Grafico>
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

      <Seccion
        id="abonos"
        titulo="Abonos realizados mensual y trimestral"
        descripcion="Cobros del período y aporte de cada usuario de caja."
        visible={visible}
      >
        <Grafico alto={220}>
          <BarChart data={mensuales} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" fontSize={10} />
            <YAxis {...ejeY} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
            <Bar dataKey="cobros" name="Abonos" fill={COLORES[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Grafico>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tabla
            head={["Mes", "Abonos"]}
            rows={mensuales.map((m) => [m.periodo, bal(m.cobros)])}
            foot={["Total", bal(acum.cobros)]}
          />
          <Tabla head={["Trimestre", "Abonos"]} rows={trimestres.map((t) => [t.nombre, bal(t.abonos)])} />
        </div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Recibos de pagos diarios · total de cobros por cajero
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Tabla
            head={["Cajero", "Recibos", "Total cobrado"]}
            rows={(f?.por_cajero ?? []).map((c) => [c.nombre, fmt(c.recibos), bal(c.total)])}
            foot={["Total", fmt((f?.por_cajero ?? []).reduce((s, c) => s + c.recibos, 0)), bal(f?.abonos_total)]}
          />
          <Grafico alto={Math.max(200, (f?.por_cajero?.length ?? 1) * 26 + 40)}>
            <BarChart
              layout="vertical"
              data={(f?.por_cajero ?? []).map((c) => ({ cajero: c.nombre.split("(")[0]!.trim(), Cobrado: c.total }))}
              margin={{ top: 5, right: 12, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" {...ejeY} />
              <YAxis type="category" dataKey="cajero" width={100} fontSize={9} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Bar dataKey="Cobrado" fill={COLORES[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </Grafico>
        </div>
      </Seccion>

      <Seccion
        id="compras"
        titulo="Compras del mes e indicadores"
        descripcion="Documentos de compra registrados y su relación con las ventas."
        visible={visible}
      >
        {d.compras ? (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <Kpi tono="primario" label="Compras del mes" valor={bal(d.compras.total)} nota={`${d.compras.compras.length} documentos`} />
              <Kpi
                label="Compras / ventas (antes ITBMS)"
                valor={pct(d.compras.total / Math.max(f?.totales.total_sin ?? 1, 1))}
              />
              <Kpi
                label="Compra promedio"
                valor={bal(d.compras.total / Math.max(d.compras.compras.length, 1))}
              />
            </div>
            <Grafico alto={220}>
              <BarChart
                data={Object.entries(
                  d.compras.compras.reduce<Record<string, number>>((a, c) => {
                    const k = c.proveedor.slice(0, 18) || "—";
                    a[k] = (a[k] ?? 0) + c.monto;
                    return a;
                  }, {}),
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([proveedor, monto]) => ({ proveedor, Compras: monto }))}
                margin={{ top: 5, right: 8, bottom: 40, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="proveedor" fontSize={9} interval={0} angle={-18} textAnchor="end" height={50} />
                <YAxis {...ejeY} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
                <Bar dataKey="Compras" fill={COLORES[5]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </Grafico>
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

      <Seccion
        id="conversion"
        titulo="Conversión de cotizaciones en ventas"
        descripcion="Cotizaciones generadas en el sitio que terminaron en factura."
        visible={visible}
      >
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-2 sm:grid-cols-3">
            <Kpi label="Cotizaciones del sitio" valor={fmt(d.conversion?.cotizaciones)} />
            <Kpi tono="positivo" label="Convertidas en factura" valor={fmt(d.conversion?.convertidas)} />
            <Kpi tono="primario" label="Tasa de conversión" valor={pct(d.conversion?.tasa)} />
          </div>
          <Grafico alto={200}>
            <PieChart>
              <Pie
                data={[
                  { nombre: "Convertidas", valor: d.conversion?.convertidas ?? 0 },
                  {
                    nombre: "Sin convertir",
                    valor: Math.max((d.conversion?.cotizaciones ?? 0) - (d.conversion?.convertidas ?? 0), 0),
                  },
                ]}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={38}
                outerRadius={70}
                paddingAngle={3}
              >
                <Cell fill={COLORES[2]} />
                <Cell fill={COLORES[3]} />
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </Grafico>
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
