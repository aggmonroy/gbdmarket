/**
 * Tipos, constantes y utilidades compartidas del módulo Informe mensual.
 * Este archivo es seguro para el navegador (sin secretos ni acceso a base de datos).
 */

export const MESES_PERIODO = [
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
] as const;

export const MESES_NOMBRE = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
] as const;

/** Trimestres del período fiscal agosto–julio. */
export const TRIMESTRES: { nombre: string; meses: string[] }[] = [
  { nombre: "1 trimestre", meses: ["AGOSTO", "SEPTIEMBRE", "OCTUBRE"] },
  { nombre: "2 trimestre", meses: ["NOVIEMBRE", "DICIEMBRE", "ENERO"] },
  { nombre: "3 trimestre", meses: ["FEBRERO", "MARZO", "ABRIL"] },
  { nombre: "4 trimestre", meses: ["MAYO", "JUNIO", "JULIO"] },
];

/** Vendedores registrados en el sistema de facturación. */
export const VENDEDORES: Record<string, string> = {
  "7": "SUCURSAL TONOSÍ",
  "8": "CASA MATRIZ",
  "12": "ELVIS DOMÍNGUEZ",
  "13": "COOP. EL PROGRESO",
  "16": "MANUEL DIAZ",
  "17": "ANA GOMEZ",
};
export const VENDEDOR_POR_DEFECTO = "17";

/**
 * Nombre del vendedor según el período del informe:
 * · 7  → siempre "SUCURSAL TONOSÍ".
 * · 8  → "CASA MATRIZ" hasta enero 2026; desde febrero 2026 se le suma Sebastián Taylor.
 * · 12 → Elvis Domínguez solo en julio y agosto de 2025.
 */
export function nombreVendedor(codigo: string, periodo?: string) {
  const p = periodo ?? "";
  if (codigo === "7") return "SUCURSAL TONOSÍ";
  if (codigo === "8") return p && p >= "2026-02" ? "CASA MATRIZ // SEBASTIÁN TAYLOR" : "CASA MATRIZ";
  if (codigo === "12") return p === "2025-07" || p === "2025-08" ? "ELVIS DOMÍNGUEZ" : `VENDEDOR ${codigo}`;
  return VENDEDORES[codigo] ?? `VENDEDOR ${codigo}`;
}


/**
 * Sucursales por prefijo del usuario de caja.
 * TOY = Tonosí · CM = Casa Matriz · LB = Línea Blanca
 */
export const SUCURSAL_POR_PREFIJO: { prefijo: string; sucursal: string }[] = [
  { prefijo: "TOY", sucursal: "Tonosí" },
  { prefijo: "CM", sucursal: "Casa Matriz" },
  { prefijo: "LB", sucursal: "Línea Blanca" },
];

/** Un usuario de caja siempre tiene la forma PREFIJO + iniciales/apellido. */
export const RE_CODIGO_CAJERO = /^(?:TOY|CM|LB)[A-ZÑ]{2,18}$/;

export function esCodigoCajero(codigo: string) {
  return RE_CODIGO_CAJERO.test(codigo.toUpperCase());
}

/** Códigos de cajero conocidos y su colaborador. */
export const CAJEROS: Record<string, string> = {
  LBAGOMEZ: "Ana Gómez (Línea Blanca)",
  LBSTAYLOR: "Sebastián Taylor (Línea Blanca)",
  LBMDIAZ: "Manuel Díaz (Línea Blanca)",
  LBVJIMENEZ: "Víctor Jiménez (Línea Blanca)",
  CMHDIAZ: "H. Díaz (Casa Matriz)",
  CMLJIMENEZ: "L. Jiménez (Casa Matriz)",
  CMLRODRIGUEZ: "L. Rodríguez (Casa Matriz)",
  CMNBARAHONA: "N. Barahona (Casa Matriz)",
  TOYGARCIA: "Y. García (Tonosí)",
  TOYNUNEZ: "Y. Núñez (Tonosí)",
};

/** Nombre visible de un cajero; los usuarios nuevos se rotulan por su sucursal. */
export function nombreCajero(codigo: string) {
  const c = codigo.toUpperCase();
  if (CAJEROS[c]) return CAJEROS[c];
  const s = SUCURSAL_POR_PREFIJO.find((p) => c.startsWith(p.prefijo));
  return s ? `${c} (${s.sucursal})` : c;
}

export const REPORTES = [
  { id: "repfacmes", nombre: "REPFACMES — Resumen mensual de ventas y recibos" },
  { id: "repartven", nombre: "REPARTVEN — Ventas por producto" },
  { id: "repvalor2", nombre: "REPVALOR2 — Inventario / valorización" },
  { id: "repmorosos", nombre: "REPMOROSOS — Morosidad vencida" },
  { id: "repmorosos2", nombre: "REPMOROSOS2 — Morosidad no vencida" },
  { id: "repclientes", nombre: "REPCLIENTES — Reporte general de clientes" },
  { id: "repcompfch", nombre: "REPCOMPFCH — Compras del mes" },
] as const;

export type ReporteId = (typeof REPORTES)[number]["id"];

export const SERIES = [
  { id: "ventas_historicas", nombre: "Ventas históricas" },
  { id: "cobros_historicos", nombre: "Cobros históricos" },
  { id: "clientes_nuevos", nombre: "Clientes nuevos" },
  { id: "instagram", nombre: "Seguidores en Instagram" },
] as const;
export type SerieId = (typeof SERIES)[number]["id"];

export const SECCIONES_INFORME = [
  { id: "ventas", nombre: "Ventas del mes y crecimiento de cartera" },
  { id: "vendedores", nombre: "Ventas por vendedor" },
  { id: "mensuales", nombre: "Ventas mensuales del período" },
  { id: "lineas", nombre: "Ventas por línea de negocio" },
  { id: "rotacion", nombre: "Rotación de productos" },
  { id: "historicas", nombre: "Ventas históricas comparativas" },
  { id: "clientes_nuevos", nombre: "Clientes nuevos históricos" },
  { id: "instagram", nombre: "Seguidores en Instagram" },
  { id: "cxc", nombre: "Recuperación de cuentas por cobrar" },
  { id: "morosidad", nombre: "Detalle de morosidad" },
  { id: "abonos", nombre: "Abonos mensuales y trimestrales" },
  { id: "compras", nombre: "Compras del mes e indicadores" },
  { id: "alertas", nombre: "Alertas de contabilidad" },
  { id: "conversion", nombre: "Conversión de cotizaciones en ventas" },
  { id: "gestion", nombre: "Informe de gestión operativa" },
] as const;
export type SeccionId = (typeof SECCIONES_INFORME)[number]["id"];

/* --------------------------------- tipos --------------------------------- */

export type VentaFila = {
  fecha: string;
  factura: string;
  tipo: string;
  condicion: "CO" | "CR";
  cliente: string;
  vendedor: string;
  subtotal: number;
  itbms: number;
  total: number;
};

export type AbonoFila = {
  fecha: string;
  recibo: string;
  cajero: string;
  cliente: string;
  monto: number;
};

export type DatosRepfacmes = {
  ventas: VentaFila[];
  abonos: AbonoFila[];
  totales: {
    contado_sin: number;
    contado_con: number;
    credito_sin: number;
    credito_con: number;
    total_sin: number;
    total_con: number;
    itbms: number;
  };
  por_vendedor: { codigo: string; nombre: string; contado: number; credito: number; total: number }[];
  por_cajero: { codigo: string; nombre: string; total: number; recibos: number }[];
  abonos_total: number;
};

export type ProductoVenta = {
  codigo: string;
  descripcion: string;
  cantidad: number;
  ventas: number;
  costo: number;
  ganancia: number;
};

export type DatosRepartven = { productos: ProductoVenta[]; total_ventas: number; total_ganancia: number };

export type DatosRepvalor2 = {
  clasificacion_por_codigo: Record<string, string>;
  clasificaciones: { codigo: string; nombre: string; costo: number; venta: number; unidades: number }[];
  total_costo: number;
  total_venta: number;
};

export type DatosMorosidad = {
  vencida: { total: number; plazos: Record<string, number> };
  no_vencida: { total: number; plazos: Record<string, number>; saldo_actual: number; cuentas: number };
};

export type AlertaCliente = {
  tipo: "saldo_negativo" | "duplicado" | "factura_duplicada" | "saldo_irregular";
  cliente: string;
  detalle: string;
  monto?: number;
};

export type DatosRepclientes = {
  clientes: { codigo: string; nombre: string; saldo: number }[];
  total_saldo: number;
  cuentas: number;
  alertas: AlertaCliente[];
};

export type DatosCompras = {
  compras: { fecha: string; proveedor: string; documento: string; monto: number }[];
  total: number;
};

export type LineaNegocio = { linea: string; ventas: number; unidades: number; ganancia: number };

export type RotacionCategoria = {
  categoria: string;
  ventas: number;
  unidades: number;
  modelos: { codigo: string; descripcion: string; unidades: number; ventas: number }[];
};

export type InformeDatos = {
  repfacmes?: DatosRepfacmes;
  repartven?: DatosRepartven;
  repvalor2?: DatosRepvalor2;
  morosidad?: DatosMorosidad;
  repclientes?: DatosRepclientes;
  compras?: DatosCompras;
  lineas?: LineaNegocio[];
  rotacion?: RotacionCategoria[];
  cxc?: {
    saldo_mes_anterior: number;
    ventas_credito: number;
    abonos: number;
    saldo_mes_actual: number;
    cxc_corriente: number;
    morosidad_total: number;
  };
  conversion?: {
    cotizaciones: number;
    convertidas: number;
    tasa: number;
    detalle: { cliente: string; cotizacion: string; factura?: string; monto?: number }[];
  };
};

export type InformeMensual = {
  id: string;
  periodo: string;
  estado: "borrador" | "generado";
  datos: InformeDatos;
  narrativa: Record<string, string>;
  gestion: { colaboradores: { nombre: string; texto_ia: string; texto_manual: string }[]; general: string };
  generado_en: string | null;
  /** Explicación de cada tabla, generada con IA y editable por la administración. */
  explicaciones?: Record<string, string>;
  /** Tamaño manual de cada tarjeta y orden de los elementos del dashboard. */
  layout?: Record<string, { ancho?: number; escala?: number; dx?: number; dy?: number; orden?: string[] }>;
};

/* ------------------------------- utilidades ------------------------------- */

/** "2026-05" -> { anio: 2026, mes: 5, mesNombre: "MAYO", periodo: "2025-2026" } */
export function infoPeriodo(periodo: string) {
  const [a, m] = periodo.split("-").map(Number);
  const anio = a ?? new Date().getFullYear();
  const mes = m ?? 1;
  const mesNombre = MESES_NOMBRE[mes - 1] ?? "";
  // El período fiscal va de agosto a julio.
  const inicio = mes >= 8 ? anio : anio - 1;
  return { anio, mes, mesNombre, periodoFiscal: `${inicio}-${inicio + 1}`, inicioFiscal: inicio };
}

export function periodoActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Lista de períodos (YYYY-MM) del año fiscal que inicia en agosto de `inicio`. */
export function mesesDelPeriodoFiscal(inicio: number) {
  return MESES_PERIODO.map((nombre, i) => {
    const mesNum = i < 5 ? 8 + i : i - 4;
    const anio = i < 5 ? inicio : inicio + 1;
    return { nombre, periodo: `${anio}-${String(mesNum).padStart(2, "0")}` };
  });
}

export const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const bal = (n: number | null | undefined) => `B/.${fmt(n)}`;

export const pct = (n: number | null | undefined) => `${((n ?? 0) * 100).toFixed(1)}%`;

export function sinItbms(conItbms: number) {
  return Math.round((conItbms / 1.07) * 100) / 100;
}
