/**
 * Vista tipo dashboard del informe mensual. Se usa tanto para la consulta
 * interactiva como para la versión imprimible (con secciones seleccionadas).
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreambuloInforme } from "./PreambuloInforme";
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

/** Escala de las gráficas de la tarjeta actual (ajuste manual del dashboard). */
const EscalaCtx = createContext(1);

function Grafico({ children, alto = 190 }: { children: React.ReactElement; alto?: number }) {
  const escala = useContext(EscalaCtx);
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2" style={{ height: Math.round(alto * escala) }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

type Edicion = {
  explicacion: (id: SeccionId, texto: string) => void;
  /** `clave` es el id de sección o `seccion:n` para bloques internos. */
  tamano: (clave: string, ancho: number, escala: number) => void;
};


/** Explicación de la tabla: texto de IA con edición manual (solo dashboard). */
function ExplicacionTabla({
  id,
  texto,
  edicion,
}: {
  id: SeccionId;
  texto?: string;
  edicion?: Edicion;
}) {
  const [borrador, setBorrador] = useState(texto ?? "");
  const [editando, setEditando] = useState(false);
  useEffect(() => setBorrador(texto ?? ""), [texto]);

  if (!edicion) {
    if (!texto) return null;
    return (
      <p className="rounded-xl border border-border bg-muted/25 p-2.5 text-xs leading-relaxed">{texto}</p>
    );
  }

  if (!editando) {
    return (
      <div className="rounded-xl border border-border bg-muted/25 p-2.5 print:hidden">
        <p className="text-xs leading-relaxed">
          {texto || <span className="text-muted-foreground">Sin explicación. Genera con IA o escríbela.</span>}
        </p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-1 text-[11px] font-medium text-primary hover:underline"
        >
          Editar explicación
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-2.5 print:hidden">
      <Textarea rows={3} value={borrador} onChange={(e) => setBorrador(e.target.value)} className="text-xs" />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            edicion.explicacion(id, borrador);
            setEditando(false);
          }}
        >
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setBorrador(texto ?? ""); setEditando(false); }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Controles manuales de tamaño de la tarjeta. */
function ControlesTamano({
  id,
  ancho,
  escala,
  edicion,
}: {
  id: SeccionId;
  ancho: number;
  escala: number;
  edicion: Edicion;
}) {
  const anchos = [50, 75, 100];
  return (
    <div className="flex flex-wrap items-center gap-1.5 print:hidden">
      <span className="text-[10px] uppercase text-muted-foreground">Ancho</span>
      {anchos.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => edicion.tamano(id, a, escala)}
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
            ancho === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {a}%
        </button>
      ))}
      <span className="ml-1 text-[10px] uppercase text-muted-foreground">Alto</span>
      <button
        type="button"
        aria-label="Reducir alto"
        onClick={() => edicion.tamano(id, ancho, Math.max(0.6, Math.round((escala - 0.1) * 10) / 10))}
        className="rounded-md border border-border p-0.5 text-muted-foreground hover:text-primary"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-8 text-center text-[10px] tabular-nums text-muted-foreground">
        {Math.round(escala * 100)}%
      </span>
      <button
        type="button"
        aria-label="Aumentar alto"
        onClick={() => edicion.tamano(id, ancho, Math.min(2, Math.round((escala + 0.1) * 10) / 10))}
        className="rounded-md border border-border p-0.5 text-muted-foreground hover:text-primary"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Tirador para arrastrar y redimensionar la tarjeta. */
function Tirador({
  lado,
  onDrag,
  onFin,
  contenedor,
}: {
  lado: "izq" | "der" | "abajo" | "esq";
  onDrag: (dx: number, dy: number, anchoContenedor: number) => void;
  onFin: () => void;
  contenedor: React.RefObject<HTMLDivElement | null>;
}) {
  const iniciar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const ancho = contenedor.current?.parentElement?.clientWidth ?? contenedor.current?.clientWidth ?? 1;
    const mover = (ev: PointerEvent) => onDrag(ev.clientX - x0, ev.clientY - y0, ancho);
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      document.body.style.userSelect = "";
      onFin();
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  const base =
    "absolute z-20 print:hidden rounded-full bg-primary/0 hover:bg-primary/40 transition-colors touch-none";
  const pos = {
    izq: "left-0 top-6 bottom-6 w-1.5 cursor-ew-resize",
    der: "right-0 top-6 bottom-6 w-1.5 cursor-ew-resize",
    abajo: "bottom-0 left-6 right-6 h-1.5 cursor-ns-resize",
    esq: "bottom-0 right-0 h-3.5 w-3.5 cursor-nwse-resize bg-primary/25 hover:bg-primary/60",
  }[lado];

  return <div role="separator" aria-label="Redimensionar tarjeta" onPointerDown={iniciar} className={`${base} ${pos}`} />;
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Lógica común de arrastre para tarjetas y bloques internos. */
function useRedimension(anchoGuardado: number, escalaGuardada: number, guardar?: (a: number, e: number) => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [arrastre, setArrastre] = useState<{ ancho: number; escala: number } | null>(null);
  const ancho = arrastre?.ancho ?? anchoGuardado;
  const escala = arrastre?.escala ?? escalaGuardada;

  const redimensionar =
    (signo: 1 | -1 | 0, dy = false) =>
    (dx: number, dyPx: number, anchoContenedor: number) => {
      const nuevoAncho =
        signo === 0 ? ancho : limitar(anchoGuardado + (signo * dx * 100) / Math.max(1, anchoContenedor), 25, 100);
      const alto = ref.current?.getBoundingClientRect().height ?? 300;
      const nuevaEscala = dy
        ? limitar(escalaGuardada * (1 + dyPx / Math.max(120, alto / Math.max(0.4, escalaGuardada))), 0.6, 2)
        : escalaGuardada;
      setArrastre({ ancho: Math.round(nuevoAncho), escala: Math.round(nuevaEscala * 100) / 100 });
    };

  const finalizar = () => {
    if (arrastre && guardar) guardar(arrastre.ancho, arrastre.escala);
    setArrastre(null);
  };

  return { ref, ancho, escala, redimensionar, finalizar };
}

/** Bloque interno de una tarjeta (tabla, gráfica o texto) redimensionable. */
function Bloque({
  clave,
  baseAncho,
  layout,
  edicion,
  children,
}: {
  clave: string;
  baseAncho: number;
  layout?: Record<string, { ancho?: number; escala?: number }>;
  edicion?: Edicion;
  children: React.ReactNode;
}) {
  const padre = useContext(EscalaCtx);
  const { ref, ancho, escala, redimensionar, finalizar } = useRedimension(
    layout?.[clave]?.ancho ?? baseAncho,
    layout?.[clave]?.escala ?? 1,
    edicion ? (a, e) => edicion.tamano(clave, a, e) : undefined,
  );

  return (
    <div
      ref={ref}
      className="relative min-w-0 break-inside-avoid"
      style={{
        flex: `1 1 ${ancho}%`,
        maxWidth: ancho >= 100 ? "100%" : `calc(${ancho}% - 0.75rem)`,
        minWidth: "min(100%, 240px)",
      }}
    >
      <EscalaCtx.Provider value={padre * escala}>
        <div className="min-w-0">{children}</div>
        {edicion && (
          <>
            <Tirador lado="izq" contenedor={ref} onDrag={redimensionar(-1)} onFin={finalizar} />
            <Tirador lado="der" contenedor={ref} onDrag={redimensionar(1)} onFin={finalizar} />
            <Tirador lado="abajo" contenedor={ref} onDrag={redimensionar(0, true)} onFin={finalizar} />
            <Tirador lado="esq" contenedor={ref} onDrag={redimensionar(1, true)} onFin={finalizar} />
          </>
        )}
      </EscalaCtx.Provider>
    </div>
  );
}

/**
 * Envuelve el contenido de una tarjeta en bloques redimensionables: las
 * rejillas se convierten en filas flexibles y cada celda (tabla, gráfica o
 * texto) puede ajustarse arrastrando sus bordes.
 */
function envolverBloques(
  children: React.ReactNode,
  id: SeccionId,
  layout?: Record<string, { ancho?: number; escala?: number }>,
  edicion?: Edicion,
) {
  let n = 0;
  return React.Children.toArray(children).map((child, i) => {
    if (!React.isValidElement(child)) return child;
    const props = child.props as { className?: string; children?: React.ReactNode };
    const cls = String(props.className ?? "");
    if (cls.includes("grid")) {
      const celdas = React.Children.toArray(props.children);
      const base = celdas.length > 1 ? Math.round(100 / celdas.length) : 100;
      return (
        <div key={`g${i}`} className="flex flex-wrap items-start gap-3">
          {celdas.map((celda, j) => (
            <Bloque key={j} clave={`${id}:${n++}`} baseAncho={base} layout={layout} edicion={edicion}>
              {celda}
            </Bloque>
          ))}
        </div>
      );
    }
    return (
      <Bloque key={`b${i}`} clave={`${id}:${n++}`} baseAncho={100} layout={layout} edicion={edicion}>
        {child}
      </Bloque>
    );
  });
}

function Seccion({
  id,
  titulo,
  descripcion,
  visible,
  explicaciones,
  layout,
  edicion,
  children,
}: {
  id: SeccionId;
  titulo: string;
  descripcion?: string;
  visible: Set<SeccionId> | null;
  explicaciones?: Record<string, string>;
  layout?: Record<string, { ancho?: number; escala?: number }>;
  edicion?: Edicion;
  children: React.ReactNode;
}) {
  const anchoGuardado = layout?.[id]?.ancho ?? 100;
  const escalaGuardada = layout?.[id]?.escala ?? 1;
  const { ref, ancho, escala, redimensionar, finalizar } = useRedimension(
    anchoGuardado,
    escalaGuardada,
    edicion ? (a, e) => edicion.tamano(id, a, e) : undefined,
  );

  if (visible && !visible.has(id)) return null;

  return (
    <div
      ref={ref}
      className="relative min-w-0 break-inside-avoid"
      style={{ flex: `1 1 ${ancho}%`, maxWidth: ancho >= 100 ? "100%" : `calc(${ancho}% - 0.75rem)` }}
    >
      <EscalaCtx.Provider value={escala}>
        <Card className="h-full break-inside-avoid overflow-hidden border-border/70 shadow-soft">
          <CardHeader className="gap-1 border-b border-border/60 bg-muted/30 py-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="h-4 w-1.5 rounded-full bg-gradient-primary" aria-hidden />
              {titulo}
            </CardTitle>
            {descripcion && <p className="pl-3.5 text-xs text-muted-foreground">{descripcion}</p>}
            {edicion && <ControlesTamano id={id} ancho={ancho} escala={escala} edicion={edicion} />}
          </CardHeader>
          <CardContent className="min-w-0 space-y-3 pt-3 text-sm [&_p]:text-justify">
            {envolverBloques(children, id, layout, edicion)}
            <ExplicacionTabla id={id} texto={explicaciones?.[id]} edicion={edicion} />
          </CardContent>
        </Card>
        {edicion && (
          <>
            <Tirador lado="izq" contenedor={ref} onDrag={redimensionar(-1)} onFin={finalizar} />
            <Tirador lado="der" contenedor={ref} onDrag={redimensionar(1)} onFin={finalizar} />
            <Tirador lado="abajo" contenedor={ref} onDrag={redimensionar(0, true)} onFin={finalizar} />
            <Tirador lado="esq" contenedor={ref} onDrag={redimensionar(1, true)} onFin={finalizar} />
          </>
        )}
      </EscalaCtx.Provider>
    </div>
  );
}



function TablaBase({
  head,
  rows,
  foot,
  denso = true,
}: {
  head: string[];
  rows: (string | number)[][];
  foot?: (string | number)[];
  denso?: boolean;
}) {
  const pad = denso ? "px-2 py-1" : "px-3 py-1.5";
  return (
    <table className="w-full table-auto border-collapse text-[11px] leading-snug sm:text-xs">
      <thead>
        <tr className="bg-primary/8 text-primary">
          {head.map((h) => (
            <th key={h} className={`${pad} text-left text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border/70 even:bg-muted/25">
            {r.map((c, j) => (
              <td
                key={j}
                className={`${pad} ${j === 0 ? "break-words" : "whitespace-nowrap text-right tabular-nums"}`}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
        {foot && (
          <tr className="border-t-2 border-primary/30 bg-primary/10 font-semibold">
            {foot.map((c, j) => (
              <td key={j} className={`${pad} ${j === 0 ? "" : "whitespace-nowrap text-right tabular-nums"}`}>
                {c}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

/**
 * Tabla del informe: siempre completa (sin scroll) y con botón para ampliar
 * a pantalla completa en el dashboard. Al imprimir, el botón se oculta.
 */
function Tabla({
  head,
  rows,
  foot,
  titulo,
}: {
  head: string[];
  rows: (string | number)[][];
  foot?: (string | number)[];
  titulo?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="group relative w-full">
      <div className="tabla-informe w-full overflow-hidden rounded-xl border border-border">
        <TablaBase head={head} rows={rows} foot={foot} />
      </div>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label="Ampliar tabla"
        title="Ampliar tabla"
        className="absolute right-1 top-1 rounded-md border border-border bg-card/90 p-1 text-muted-foreground opacity-0 shadow-soft transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 print:hidden"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <Dialog open={abierta} onOpenChange={setAbierta}>
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-6xl overflow-auto print:hidden">
          <DialogHeader>
            <DialogTitle className="text-base">{titulo ?? "Detalle de la tabla"}</DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-x-auto rounded-xl border border-border">
            <TablaBase head={head} rows={rows} foot={foot} denso={false} />
          </div>
        </DialogContent>
      </Dialog>
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
  edicion,
}: {
  informe: InformeMensual;
  series: SerieFila[];
  secciones?: SeccionId[];
  imprimible?: boolean;
  /** Solo en el dashboard de administración: editar explicaciones y tamaños. */
  edicion?: Edicion;
}) {
  const visible = secciones ? new Set(secciones) : null;
  const expl = informe.explicaciones ?? {};
  const lay = informe.layout ?? {};
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

  /** Modelos más vendidos del mes, con su categoría del catálogo. */
  const topModelos = (d.rotacion ?? [])
    .flatMap((c) => c.modelos.map((m) => ({ ...m, categoria: c.categoria })))
    .sort((a, b) => b.unidades - a.unidades || b.ventas - a.ventas)
    .slice(0, 15);

  const vendedores = (f?.por_vendedor ?? []).map((v) => ({
    ...v,
    etiqueta: nombreVendedor(v.codigo, informe.periodo),
  }));

  return (
    <div className={`flex flex-wrap items-start gap-3 ${imprimible ? "print:gap-2" : ""}`}>
      <div className="w-full">
        <PreambuloInforme periodo={informe.periodo} estado={informe.estado} generadoEn={informe.generado_en} />
      </div>


      <Seccion
        id="ventas"
        titulo="1. Ventas del mes y crecimiento de cartera"
        descripcion="Resumen de facturación al contado y al crédito, con y sin ITBMS."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-2">
            <Tabla
              head={["Concepto", "Antes del 7%", "ITBMS", "Con ITBMS"]}
              rows={[
                ["Al contado", bal(f?.totales.contado_sin), bal((f?.totales.contado_con ?? 0) - (f?.totales.contado_sin ?? 0)), bal(f?.totales.contado_con)],
                ["Al crédito", bal(f?.totales.credito_sin), bal((f?.totales.credito_con ?? 0) - (f?.totales.credito_sin ?? 0)), bal(f?.totales.credito_con)],
              ]}
              foot={["Total", bal(f?.totales.total_sin), bal(f?.totales.itbms), bal(f?.totales.total_con)]}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <Kpi label="Abonos del mes" valor={bal(f?.abonos_total)} />
              <Kpi label="Acumulado del período" valor={bal(sinItbms(acum.total))} nota="antes del 7%" />
              <Kpi tono="positivo" label="Cobros del período" valor={bal(acum.cobros)} />
            </div>
          </div>
          <div className="space-y-2">
            <Grafico alto={150}>
              <PieChart>
                <Pie
                  data={[
                    { nombre: "Contado", valor: f?.totales.contado_con ?? 0 },
                    { nombre: "Crédito", valor: f?.totales.credito_con ?? 0 },
                  ]}
                  dataKey="valor"
                  nameKey="nombre"
                  innerRadius={38}
                  outerRadius={66}
                  paddingAngle={3}
                >
                  <Cell fill={COLORES[0]} />
                  <Cell fill={COLORES[1]} />
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
                <Legend />
              </PieChart>
            </Grafico>
            {informe.narrativa?.ventas && (
              <p className="rounded-xl border border-border bg-muted/30 p-2.5 text-xs leading-relaxed">
                {informe.narrativa.ventas}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      <Seccion
        id="vendedores"
        titulo="Ventas por vendedor"
        descripcion="Aporte de cada vendedor al total facturado del mes."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Tabla
            head={["Cód.", "Vendedor", "Contado", "Crédito", "Total"]}
            rows={vendedores.map((v) => [v.codigo, v.etiqueta, bal(v.contado), bal(v.credito), bal(v.total)])}
            foot={["", "Total", bal(f?.totales.contado_con), bal(f?.totales.credito_con), bal(f?.totales.total_con)]}
          />
          <Grafico alto={175}>
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
        </div>
      </Seccion>

      <Seccion
        id="mensuales"
        titulo={`Ventas mensuales del período ${periodoFiscal} (en balboas)`}
        descripcion="Evolución mes a mes de ventas y cobros del año fiscal agosto–julio."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Tabla
            head={["Mes", "Contado", "Crédito", "Total"]}
            rows={mensuales.map((m) => [m.periodo, bal(m.contado), bal(m.credito), bal(m.total)])}
            foot={["Total", bal(acum.contado), bal(acum.credito), bal(acum.total)]}
          />
          <Grafico alto={185}>
            <ComposedChart data={mensuales} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" fontSize={10} />
              <YAxis {...ejeY} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Legend />
              <Bar dataKey="contado" name="Contado" stackId="v" fill={COLORES[0]} />
              <Bar dataKey="credito" name="Crédito" stackId="v" fill={COLORES[1]} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="cobros" name="Cobros" stroke={COLORES[2]} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </Grafico>
        </div>
      </Seccion>

      <Seccion
        id="lineas"
        titulo="Ventas por línea de negocio"
        descripcion="Participación de cada línea en las ventas y la ganancia del mes."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        {d.lineas?.length ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
            <Grafico alto={165}>
              <PieChart>
                <Pie data={d.lineas} dataKey="ventas" nameKey="linea" innerRadius={38} outerRadius={68} paddingAngle={3}>
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
        titulo="Rotación de productos · categorías del catálogo"
        descripcion="Unidades vendidas por categoría (según el catálogo) y los modelos más vendidos del mes."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        {d.rotacion?.length ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Tabla
              head={["Categoría", "Unid.", "Ventas"]}
              rows={d.rotacion.map((c) => [c.categoria, fmt(c.unidades), bal(c.ventas)])}
              foot={[
                "Total",
                fmt(d.rotacion.reduce((s, c) => s + c.unidades, 0)),
                bal(d.rotacion.reduce((s, c) => s + c.ventas, 0)),
              ]}
            />
            <Grafico alto={Math.max(170, Math.min(260, d.rotacion.length * 22 + 30))}>
              <BarChart
                layout="vertical"
                data={d.rotacion.map((c) => ({ categoria: c.categoria, Unidades: c.unidades }))}
                margin={{ top: 5, right: 12, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="categoria" width={110} fontSize={9} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => fmt(Number(v))} />
                <Bar dataKey="Unidades" fill={COLORES[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </Grafico>
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Modelos más vendidos del mes
              </div>
              <Tabla
                head={["Modelo", "Descripción", "Categoría", "Unid."]}
                rows={topModelos.map((m) => [m.codigo, m.descripcion, m.categoria, fmt(m.unidades)])}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPARTVEN para ver la rotación.</p>
        )}
      </Seccion>

      <Seccion id="historicas" titulo="Cuadro comparativo de ventas históricas de la mueblería" visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Tabla
            head={["Mes", ...aniosVentas(ventasSerie)]}
            rows={MESES_PERIODO.map((n, i) => {
              const mesNum = i < 5 ? 8 + i : i - 4;
              return [
                n.slice(0, 3),
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
          <Grafico alto={185}>
            <LineChart
              data={MESES_PERIODO.map((n, i) => {
                const mesNum = i < 5 ? 8 + i : i - 4;
                const fila: any = { mes: n.slice(0, 3) };
                for (const a of aniosVentas(ventasSerie)) {
                  const anioReal = i < 5 ? Number(a.split("-")[0]) : Number(a.split("-")[1] ?? a);
                  fila[a] = ventasSerie[`${anioReal}-${String(mesNum).padStart(2, "0")}`]?.total ?? 0;
                }
                return fila;
              })}
              margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" fontSize={10} />
              <YAxis {...ejeY} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Legend />
              {aniosVentas(ventasSerie).map((a, i) => (
                <Line key={a} type="monotone" dataKey={a} stroke={COLORES[i % COLORES.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </Grafico>
        </div>
      </Seccion>

      <Seccion id="clientes_nuevos" titulo="Cuadro comparativo de clientes nuevos históricos" visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        {aniosNuevos.length ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
            <Grafico alto={180}>
              <BarChart
                data={MESES_NOMBRE_CORTO.map((m, i) => {
                  const fila: any = { mes: m };
                  for (const a of aniosNuevos) fila[a] = nuevosSerie[`${a}-${String(i + 1).padStart(2, "0")}`]?.clientes ?? 0;
                  return fila;
                })}
                margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                {aniosNuevos.map((a, i) => (
                  <Bar key={a} dataKey={a} fill={COLORES[i % COLORES.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </Grafico>
          </div>
        ) : (
          <p className="text-muted-foreground">Registra los clientes nuevos por mes en “Datos históricos”.</p>
        )}
      </Seccion>

      <Seccion id="instagram" titulo="Seguidores en Instagram · Línea Blanca y Bordados" visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        {aniosIg.length ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Tabla
              head={["Mes", ...aniosIg.flatMap((a) => [`LB ${a}`, `BD ${a}`])]}
              rows={MESES_NOMBRE_CORTO.map((m, i) => [
                m,
                ...aniosIg.flatMap((a) => {
                  const p = `${a}-${String(i + 1).padStart(2, "0")}`;
                  return [fmt(igSerie[p]?.linea_blanca ?? 0), fmt(igSerie[p]?.bordados ?? 0)];
                }),
              ])}
            />
            <Grafico alto={180}>
              <LineChart data={igChart} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                {Object.keys(igChart[0] ?? {})
                  .filter((k) => k !== "mes")
                  .map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={COLORES[i % COLORES.length]} strokeWidth={2} dot={false} />
                  ))}
              </LineChart>
            </Grafico>
          </div>
        ) : (
          <p className="text-muted-foreground">Carga una captura de estadísticas de Instagram en “Datos históricos”.</p>
        )}
      </Seccion>

      <Seccion
        id="cxc"
        titulo="2. Recuperación de cuentas por cobrar"
        descripcion="Composición de la cartera y su movimiento: saldo anterior + ventas al crédito − abonos."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-3">
          <Grafico alto={175}>
            <PieChart>
              <Pie
                data={[
                  { nombre: "Vencida", valor: d.morosidad?.vencida.total ?? 0 },
                  { nombre: "No vencida", valor: d.morosidad?.no_vencida.total ?? 0 },
                  { nombre: "Corriente", valor: d.cxc?.cxc_corriente ?? 0 },
                ]}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={38}
                outerRadius={66}
                paddingAngle={3}
              >
                <Cell fill={COLORES[4]} />
                <Cell fill={COLORES[3]} />
                <Cell fill={COLORES[0]} />
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Legend />
            </PieChart>
          </Grafico>
          <Grafico alto={175}>
            <BarChart
              data={[
                { etapa: "Saldo ant.", valor: d.cxc?.saldo_mes_anterior ?? 0 },
                { etapa: "+ Crédito", valor: d.cxc?.ventas_credito ?? 0 },
                { etapa: "− Abonos", valor: d.cxc?.abonos ?? 0 },
                { etapa: "Saldo actual", valor: d.cxc?.saldo_mes_actual ?? 0 },
              ]}
              margin={{ top: 5, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="etapa" fontSize={9} />
              <YAxis {...ejeY} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Bar dataKey="valor" name="Cartera" radius={[4, 4, 0, 0]}>
                {[COLORES[3], COLORES[1], COLORES[2], COLORES[0]].map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Bar>
            </BarChart>
          </Grafico>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Kpi label="Saldo mes anterior" valor={bal(d.cxc?.saldo_mes_anterior)} />
              <Kpi tono="primario" label="Saldo actual" valor={bal(d.cxc?.saldo_mes_actual)} />
              <Kpi tono="positivo" label="Abonos del mes" valor={bal(d.cxc?.abonos)} />
              <Kpi
                label="Recuperación"
                valor={pct((d.cxc?.abonos ?? 0) / Math.max(d.cxc?.saldo_mes_actual ?? 1, 1))}
              />
            </div>
            {informe.narrativa?.recuperacion && (
              <p className="rounded-xl border border-border bg-muted/30 p-2.5 text-xs leading-relaxed">
                {informe.narrativa.recuperacion}
              </p>
            )}
          </div>
        </div>
      </Seccion>

      <Seccion
        id="morosidad"
        titulo="Morosidad vencida y no vencida por plazos"
        descripcion="Distribución de la deuda por antigüedad de los plazos."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-3">
          <Tabla
            head={["Plazo vencido", "Monto"]}
            rows={Object.entries(d.morosidad?.vencida.plazos ?? {}).map(([k, v]) => [k, bal(v)])}
            foot={["Total", bal(d.morosidad?.vencida.total)]}
          />
          <Tabla
            head={["Plazo no vencido", "Monto"]}
            rows={Object.entries(d.morosidad?.no_vencida.plazos ?? {}).map(([k, v]) => [k, bal(v)])}
            foot={["Total", bal(d.morosidad?.no_vencida.total)]}
          />
          <Grafico alto={175}>
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
        </div>
      </Seccion>

      <Seccion
        id="abonos"
        titulo="Abonos realizados mensual y trimestral"
        descripcion="Cobros registrados en el período fiscal."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-3">
          <Tabla
            head={["Mes", "Abonos"]}
            rows={mensuales.map((m) => [m.periodo, bal(m.cobros)])}
            foot={["Total", bal(acum.cobros)]}
          />
          <Tabla head={["Trimestre", "Abonos"]} rows={trimestres.map((t) => [t.nombre, bal(t.abonos)])} />
          <Grafico alto={175}>
            <BarChart data={mensuales} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" fontSize={10} />
              <YAxis {...ejeY} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
              <Bar dataKey="cobros" name="Abonos" fill={COLORES[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </Grafico>
        </div>
      </Seccion>

      <Seccion id="compras" titulo="Compras del mes" descripcion="Documentos de compra registrados en el mes." visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        {d.compras ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-3">
            <div className="space-y-2">
              <Kpi tono="primario" label="Compras del mes" valor={bal(d.compras.total)} nota={`${d.compras.compras.length} documentos`} />
              <Kpi
                label="Compras / ventas (antes ITBMS)"
                valor={pct(d.compras.total / Math.max(f?.totales.total_sin ?? 1, 1))}
              />
              <Kpi label="Compra promedio" valor={bal(d.compras.total / Math.max(d.compras.compras.length, 1))} />
            </div>
            <Grafico alto={185}>
              <BarChart
                layout="vertical"
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
                margin={{ top: 5, right: 12, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...ejeY} />
                <YAxis type="category" dataKey="proveedor" width={100} fontSize={9} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => bal(Number(v))} />
                <Bar dataKey="Compras" fill={COLORES[5]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </Grafico>
            <Tabla
                head={["Fecha", "Proveedor", "Monto"]}
                rows={d.compras.compras.slice(0, 40).map((c) => [c.fecha, c.proveedor, bal(c.monto)])}
                foot={["", "Total", bal(d.compras.total)]}
              />
          </div>
        ) : (
          <p className="text-muted-foreground">Carga el reporte REPCOMPFCH para registrar las compras del mes.</p>
        )}
      </Seccion>

      <Seccion id="alertas" titulo="Alertas de contabilidad" visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Kpi label="Cuentas con saldo" valor={fmt(d.repclientes?.cuentas)} />
            <Kpi label="Saldo total de clientes" valor={bal(d.repclientes?.total_saldo)} />
            <Kpi tono="alerta" label="Situaciones a revisar" valor={fmt(d.repclientes?.alertas.length ?? 0)} />
          </div>
          {d.repclientes?.alertas.length ? (
            <Tabla
              head={["Cliente", "Tipo", "Detalle"]}
              rows={d.repclientes.alertas.map((a) => [a.cliente, a.tipo.replace(/_/g, " "), a.detalle])}
            />
          ) : (
            <p className="text-xs text-muted-foreground">{informe.narrativa?.alertas ?? "Sin alertas registradas."}</p>
          )}
        </div>
      </Seccion>

      <Seccion
        id="conversion"
        titulo="Conversión de cotizaciones en ventas"
        descripcion="Cotizaciones generadas en el sitio que terminaron en factura."
        visible={visible} explicaciones={expl} layout={lay} edicion={edicion}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-3">
          <div className="grid gap-2">
            <Kpi label="Cotizaciones del sitio" valor={fmt(d.conversion?.cotizaciones)} />
            <Kpi tono="positivo" label="Convertidas en factura" valor={fmt(d.conversion?.convertidas)} />
            <Kpi tono="primario" label="Tasa de conversión" valor={pct(d.conversion?.tasa)} />
          </div>
          <Grafico alto={160}>
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
                innerRadius={34}
                outerRadius={62}
                paddingAngle={3}
              >
                <Cell fill={COLORES[2]} />
                <Cell fill={COLORES[3]} />
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </Grafico>
          {d.conversion?.detalle.length ? (
            <Tabla
              head={["Cliente", "Cotización", "Factura", "Monto"]}
              rows={d.conversion.detalle.map((c) => [c.cliente, c.cotizacion, c.factura ?? "—", c.monto ? bal(c.monto) : "—"])}
            />
          ) : (
            <p className="text-xs text-muted-foreground">No hubo cotizaciones del sitio en el mes.</p>
          )}
        </div>
      </Seccion>

      <Seccion id="gestion" titulo="3. Informe de gestión operativa" visible={visible} explicaciones={expl} layout={lay} edicion={edicion}>
        {informe.gestion?.general && <p className="text-xs leading-relaxed">{informe.gestion.general}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {(informe.gestion?.colaboradores ?? []).map((c) => (
            <div key={c.nombre} className="break-inside-avoid rounded-lg border border-border p-2.5">
              <div className="text-xs font-semibold uppercase tracking-wide">{c.nombre}</div>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed">{c.texto_ia}</p>
              {c.texto_manual && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed">{c.texto_manual}</p>}
            </div>
          ))}
        </div>
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
