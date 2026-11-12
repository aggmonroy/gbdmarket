/**
 * Reglas y valores de los formatos internos del portal (copiados de los Excel originales).
 * Nada de esto se guarda en la base de datos: los formatos se llenan, imprimen y descargan en el equipo.
 */

export const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Convierte lo que escribe la persona ("1,250.50", "B/. 20") a número; vacío o inválido = 0. */
export function num(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export const dinero = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const suma = (xs: number[]) => redondear(xs.reduce((a, b) => a + b, 0));

export function hoyISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-11-12" → "12/11/2026" */
export function fechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

// ---------------------------------------------------------------- Arqueos

export const BILLETES = [100, 50, 20, 10, 5, 1] as const;
export const MONEDAS = [10, 1, 0.5, 0.25, 0.1, 0.05, 0.01] as const;

export type ArqueoTipo = "caja" | "caja-menuda";

export const ARQUEO_CONFIG: Record<
  ArqueoTipo,
  {
    titulo: string;
    otros: readonly string[];
    fondo: string;
    totalLabel: string;
    declaracion: boolean;
    firma: { nombre: string; cargo: string };
    revisado: { nombre: string; cargo: string } | null;
  }
> = {
  // ARQUEO.xlsx (Hoja2): efectivo + BAC + cheques + Yappy + ACH + anulación; fondo de cambio 500.
  caja: {
    titulo: "Arqueo de Caja",
    otros: ["Boucher de BAC", "Cheques", "Yappy", "ACH", "Anulación"],
    fondo: "500",
    totalLabel: "Total ingreso del día",
    declaracion: true,
    firma: { nombre: "", cargo: "Colaborador" },
    revisado: { nombre: "", cargo: "Administrador" },
  },
  // caja_menuda.xlsx (Hoja2): efectivo + comprobantes; fondo 100; firma de la administradora.
  "caja-menuda": {
    titulo: "Arqueo de Caja Menuda",
    otros: ["Comprobantes"],
    fondo: "100",
    totalLabel: "Total",
    declaracion: false,
    firma: { nombre: "Ana Gomez", cargo: "Administradora" },
    revisado: null,
  },
};

export type Arqueo = {
  fecha: string;
  billetes: string[];
  monedas: string[];
  otros: string[];
  fondo: string;
  recibos: string;
  firmaNombre: string;
  firmaCargo: string;
  revisadoNombre: string;
  revisadoCargo: string;
};

export function arqueoInicial(tipo: ArqueoTipo): Arqueo {
  const c = ARQUEO_CONFIG[tipo];
  return {
    fecha: hoyISO(),
    billetes: BILLETES.map(() => ""),
    monedas: MONEDAS.map(() => ""),
    otros: c.otros.map(() => ""),
    fondo: c.fondo,
    recibos: "",
    firmaNombre: c.firma.nombre,
    firmaCargo: c.firma.cargo,
    revisadoNombre: c.revisado?.nombre ?? "",
    revisadoCargo: c.revisado?.cargo ?? "",
  };
}

export type EstadoDiferencia = "Sobrante" | "Faltante" | "No hay";

/** =IF(G38>0,"sobrante",IF(G38<0,"Faltante","No hay")) */
export function estadoDiferencia(diferencia: number): EstadoDiferencia {
  const d = redondear(diferencia);
  return d > 0 ? "Sobrante" : d < 0 ? "Faltante" : "No hay";
}

export function calcularArqueo(a: Pick<Arqueo, "billetes" | "monedas" | "otros" | "fondo" | "recibos">) {
  const lineasBilletes = BILLETES.map((v, i) => redondear(v * num(a.billetes[i])));
  const lineasMonedas = MONEDAS.map((v, i) => redondear(v * num(a.monedas[i])));
  const totalBilletes = suma(lineasBilletes);
  const totalMonedas = suma(lineasMonedas);
  const efectivo = redondear(totalBilletes + totalMonedas);
  const totalDinero = redondear(efectivo + suma(a.otros.map(num)));
  const totalIngreso = redondear(totalDinero - num(a.fondo));
  const diferencia = redondear(totalIngreso - num(a.recibos));
  return {
    lineasBilletes,
    lineasMonedas,
    totalBilletes,
    totalMonedas,
    efectivo,
    totalDinero,
    totalIngreso,
    diferencia,
    estado: estadoDiferencia(diferencia),
  };
}

// ---------------------------------------------------------------- Pedido a proveedor

export const UNIDADES_PEDIDO = ["UNIDADES", "BULTOS"] as const;
export type LineaPedido = { cantidad: string; unidad: string; modelo: string; descripcion: string; precio: string };
export const lineaPedidoVacia = (): LineaPedido => ({ cantidad: "", unidad: "UNIDADES", modelo: "", descripcion: "", precio: "" });
/** =A6*E6 */
export const totalLineaPedido = (l: LineaPedido) => redondear(num(l.cantidad) * num(l.precio));
export const totalPedido = (ls: LineaPedido[]) => suma(ls.map(totalLineaPedido));

// ---------------------------------------------------------------- Traslados / envío a El Progreso

export type LineaTraslado = { articulo: string; cantidad: string; codigo: string; precio: string };
export const lineaTrasladoVacia = (): LineaTraslado => ({ articulo: "", cantidad: "", codigo: "", precio: "" });
/** Fila TOTAL: suma de cantidades y =SUM(E9:E10) de la columna precio. */
export function totalesTraslado(ls: LineaTraslado[]) {
  return { cantidad: suma(ls.map((l) => num(l.cantidad))), precio: suma(ls.map((l) => num(l.precio))) };
}

// ---------------------------------------------------------------- Control de horas

export type LineaHoras = { fecha: string; desde: string; hasta: string; horas: string; aplicable: string; justificacion: string };
export const lineaHorasVacia = (): LineaHoras => ({ fecha: "", desde: "", hasta: "", horas: "", aplicable: "", justificacion: "" });
/** TOTAL DE HORAS: =SUM(horas) y =SUM(tiempo aplicable); los descuentos se anotan en negativo. */
export function totalesHoras(ls: LineaHoras[]) {
  return { horas: suma(ls.map((l) => num(l.horas))), aplicable: suma(ls.map((l) => num(l.aplicable))) };
}
