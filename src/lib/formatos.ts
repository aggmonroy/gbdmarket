/**
 * Reglas y valores de los formatos internos del portal (copiados de los Excel originales).
 * Los formatos se llenan en el equipo; al imprimir o descargar se guardan en el registro diario de documentos.
 */

export const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const suma = (xs: number[]) => redondear(xs.reduce((a, b) => a + b, 0));

/** Convierte lo que escribe la persona ("1,250.50", "B/. 20") a número; vacío o inválido = 0. */
export function num(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = Number(String(v).replace(/,/g, "").replace(/B\/\.?/gi, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Montos escritos en una celda de comprobantes: "+10+15+20" → [10, 15, 20]; "50-5" → [50, -5]. */
export function partesComprobantes(v: string | null | undefined): number[] {
  if (!v) return [];
  const limpio = String(v).replace(/,/g, "").replace(/B\/\.?/gi, "").replace(/\s+/g, "").replace(/^=/, "");
  return (limpio.match(/[+-]?[^+-]+/g) ?? []).map(num).filter((n) => n !== 0);
}

/** Suma de los comprobantes de una celda, como en Excel: "+10+15+20" = 45. */
export const sumarComprobantes = (v: string | null | undefined) => suma(partesComprobantes(v));

export const dinero = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    /** Depósitos para realizar y anulaciones/devoluciones antes de las firmas. */
    depositos: boolean;
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
    depositos: true,
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
    depositos: false,
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
  observaciones: string;
  /** Depósitos para realizar (admiten sumas +10+15+20). */
  depositoNacional: string;
  depositoGeneral: string;
  depositoBac: string;
  /** Anulaciones y devoluciones: números de documento y monto. */
  devolucionFactura: string;
  devolucionMonto: string;
  anulacionRecibo: string;
  anulacionMonto: string;
};

export const DEPOSITOS_ARQUEO = [
  { campo: "depositoNacional", label: "Banco Nacional (efectivo, cheques y transferencias)" },
  { campo: "depositoGeneral", label: "Banco General" },
  { campo: "depositoBac", label: "Voucher de BAC" },
] as const;

/** Suma de los depósitos para realizar. */
export const totalDepositos = (a: Pick<Arqueo, "depositoNacional" | "depositoGeneral" | "depositoBac">) =>
  suma([a.depositoNacional, a.depositoGeneral, a.depositoBac].map(sumarComprobantes));

/** Suma de devoluciones y anulaciones. */
export const totalAnulaciones = (a: Pick<Arqueo, "devolucionMonto" | "anulacionMonto">) =>
  suma([a.devolucionMonto, a.anulacionMonto].map(sumarComprobantes));

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
    observaciones: "",
    depositoNacional: "",
    depositoGeneral: "",
    depositoBac: "",
    devolucionFactura: "",
    devolucionMonto: "",
    anulacionRecibo: "",
    anulacionMonto: "",
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
  // Cada celda de BAC, cheques, Yappy, ACH, anulación o comprobantes admite sumas (+10+15+20).
  const totalDinero = redondear(efectivo + suma(a.otros.map(sumarComprobantes)));
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

/** Sucursales sugeridas para origen y destino de un traslado (se puede escribir otra). */
export const SUCURSALES_TRASLADO = [
  "Casa Matriz",
  "Mueblería GBD Las Tablas (Línea Blanca)",
  "Sucursal Tonosí",
  "Punto de venta Coop. El Progreso, R.L.",
  "Bordados GBD",
] as const;

export type TrasladoTipo = "linea-blanca" | "progreso";

export const TRASLADO_CONFIG: Record<TrasladoTipo, { titulo: string; destino: string }> = {
  // TRASLADOS.xlsx
  "linea-blanca": {
    titulo: "CONTROL DE ENVÍO Y TRASLADOS DE MERCANCÍA DE SECCIÓN LÍNEA BLANCA",
    destino: "",
  },
  // PROGRESO_TRASLADOS.xlsx
  progreso: {
    titulo: "CONTROL DE ENVÍO DE MERCANCÍA Y ACTIVO FIJO A PUNTO DE VENTA COOP. EL PROGRESO, R.L.",
    destino: "Punto de venta Coop. El Progreso, R.L.",
  },
};

export type Traslado = {
  fecha: string;
  origen: string;
  destino: string;
  lineas: LineaTraslado[];
  auditado: string;
  auditadoHora: string;
  autorizado: string;
  autorizadoHora: string;
  entregadoSalida: string;
  entregadoRetorno: string;
  recibidoSalida: string;
  recibidoRetorno: string;
  recibidoRetornoHora: string;
  horaSalida: string;
  horaRetorno: string;
};

export function trasladoInicial(tipo: TrasladoTipo): Traslado {
  return {
    fecha: hoyISO(),
    origen: "Mueblería GBD Las Tablas (Línea Blanca)",
    destino: TRASLADO_CONFIG[tipo].destino,
    lineas: [lineaTrasladoVacia(), lineaTrasladoVacia()],
    auditado: "",
    auditadoHora: "",
    autorizado: "",
    autorizadoHora: "",
    entregadoSalida: "",
    entregadoRetorno: "",
    recibidoSalida: "",
    recibidoRetorno: "",
    recibidoRetornoHora: "",
    horaSalida: "",
    horaRetorno: "",
  };
}

/** Faltan datos obligatorios del traslado: sucursal de origen y de destino, distintas. */
export function errorSucursalesTraslado(t: Pick<Traslado, "origen" | "destino">): string | null {
  if (!t.origen.trim()) return "Indica la sucursal de origen.";
  if (!t.destino.trim()) return "Indica la sucursal de destino.";
  if (t.origen.trim().toLowerCase() === t.destino.trim().toLowerCase())
    return "La sucursal de origen y la de destino deben ser distintas.";
  return null;
}
export { fechaLarga } from "./orden-combustible";

// ---------------------------------------------------------------- Requisitos de crédito (REQUISITOS.xlsx)

/** Fila de monto con concepto editable; el monto admite sumas (+10+10+10) como en el Excel. */
export type LineaMonto = { concepto: string; monto: string };

export const GASTOS_DECLARACION = [
  "Alimentación",
  "Servicios básicos",
  "Gastos educativos",
  "Transporte/combustible",
  "Gastos financieros",
  "Gastos operacionales",
  "Otros gastos:",
] as const;

export const FRECUENCIAS_INGRESO = ["MENSUAL", "QUINCENAL", "SEMANAL", "DIARIO"] as const;

export type Declaracion = {
  fecha: string;
  nombre: string;
  numeroCliente: string;
  cedula: string;
  profesion: string;
  direccion: string;
  frecuencia: string;
  ingresos: LineaMonto[];
  costoVentas: string;
  gastos: LineaMonto[];
};

export function declaracionInicial(): Declaracion {
  return {
    fecha: hoyISO(),
    nombre: "",
    numeroCliente: "",
    cedula: "",
    profesion: "",
    direccion: "",
    frecuencia: "MENSUAL",
    ingresos: [1, 2, 3, 4].map((n) => ({ concepto: `ACTIVIDAD ${n}`, monto: "" })),
    costoVentas: "",
    gastos: GASTOS_DECLARACION.map((concepto) => ({ concepto, monto: "" })),
  };
}

/**
 * Declaración de ingresos de independientes.
 * Ingresos brutos = total de ingresos − costos de ventas.
 * Ganancia neta = ingresos brutos − total de gastos (corrige el Excel, que restaba los gastos al total de ingresos).
 */
export function calcularDeclaracion(d: Pick<Declaracion, "ingresos" | "costoVentas" | "gastos">) {
  const totalIngresos = suma(d.ingresos.map((l) => sumarComprobantes(l.monto)));
  const costoVentas = sumarComprobantes(d.costoVentas);
  const ingresosBrutos = redondear(totalIngresos - costoVentas);
  const totalGastos = suma(d.gastos.map((l) => sumarComprobantes(l.monto)));
  const gananciaNeta = redondear(ingresosBrutos - totalGastos);
  return { totalIngresos, costoVentas, ingresosBrutos, totalGastos, gananciaNeta };
}

export const PROVINCIAS_PANAMA = [
  "Los Santos",
  "Herrera",
  "Coclé",
  "Veraguas",
  "Panamá",
  "Panamá Oeste",
  "Chiriquí",
  "Colón",
  "Bocas del Toro",
  "Darién",
  "Comarca Guna Yala",
  "Comarca Emberá-Wounaan",
  "Comarca Ngäbe-Buglé",
] as const;

export type ArticuloCliente = { modelo: string; descripcion: string };

export type DatosCliente = {
  fecha: string;
  numeroCliente: string;
  numeroAsociado: string;
  facturaSistema: string;
  facturaElectronica: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  provincia: string;
  distrito: string;
  corregimiento: string;
  comunidad: string;
  barriada: string;
  detalles: string;
  articulos: ArticuloCliente[];
  lugarTrabajo: string;
  abono: string;
  letraMensual: string;
  letraQuincenal: string;
  observaciones: string;
};

export function datosClienteInicial(): DatosCliente {
  return {
    fecha: hoyISO(),
    numeroCliente: "",
    numeroAsociado: "",
    facturaSistema: "",
    facturaElectronica: "",
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    provincia: "Los Santos",
    distrito: "",
    corregimiento: "",
    comunidad: "",
    barriada: "",
    detalles: "",
    articulos: [
      { modelo: "", descripcion: "" },
      { modelo: "", descripcion: "" },
    ],
    lugarTrabajo: "",
    abono: "",
    letraMensual: "",
    letraQuincenal: "",
    observaciones: "",
  };
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-11-17" → { dia: "17", mes: "noviembre", anio: "2026" } para "el __ de ____ de ____". */
export function partesFecha(fecha: string): { dia: string; mes: string; anio: string } {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d || m > 12) return { dia: "", mes: "", anio: "" };
  return { dia: String(d), mes: MESES[m - 1], anio: String(y) };
}

// ---------------------------------------------------------------- Inventario por sucursal
export type MovimientoTraslado = { numero: string; fecha: string; origen: string; destino: string; lineas: LineaTraslado[] };
export type ExistenciaSucursal = { articulo: string; codigo: string; entradas: number; salidas: number; disponible: number };

const normSuc = (s: string) => s.trim().replace(/\s+/g, " ");
const claveArt = (l: { articulo: string; codigo: string }) =>
  (l.codigo.trim() ? `c:${l.codigo.trim().toUpperCase()}` : `a:${l.articulo.trim().toLowerCase()}`);

/** Consolida los traslados vigentes: suma la cantidad en el destino y la resta del origen. */
export function consolidarInventario(movs: MovimientoTraslado[]): Record<string, ExistenciaSucursal[]> {
  const mapa = new Map<string, Map<string, ExistenciaSucursal>>();
  const mov = (suc: string, l: LineaTraslado, cant: number, entrada: boolean) => {
    const s = normSuc(suc);
    if (!s) return;
    const m = mapa.get(s) ?? new Map<string, ExistenciaSucursal>();
    mapa.set(s, m);
    const k = claveArt(l);
    const e = m.get(k) ?? { articulo: l.articulo.trim(), codigo: l.codigo.trim(), entradas: 0, salidas: 0, disponible: 0 };
    if (!e.articulo && l.articulo.trim()) e.articulo = l.articulo.trim();
    if (entrada) e.entradas += cant;
    else e.salidas += cant;
    e.disponible = e.entradas - e.salidas;
    m.set(k, e);
  };
  for (const t of movs) {
    for (const l of t.lineas ?? []) {
      const cant = num(l.cantidad);
      if (!cant || (!l.articulo.trim() && !l.codigo.trim())) continue;
      mov(t.destino, l, cant, true);
      mov(t.origen, l, cant, false);
    }
  }
  const out: Record<string, ExistenciaSucursal[]> = {};
  for (const [s, m] of [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])))
    out[s] = [...m.values()].sort((a, b) => a.articulo.localeCompare(b.articulo));
  return out;
}
