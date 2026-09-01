/**
 * COTIZACIONES DE EL PROGRESO (revendedor aliado)
 * ------------------------------------------------
 * Reglas totalmente distintas a las de la Cooperativa Gladys B. de Ducasa:
 * El Progreso coloca su propio precio de etiqueta, su margen de crédito y el
 * tope de plazo. Nada se guarda en GBD Market: la cotización vive solo en el
 * navegador mientras el enlace está abierto.
 */

/** Clave del enlace especial de El Progreso. */
export const CLAVE_PROGRESO = "gp-2026";

/** Datos del punto de venta que se imprimen en el membrete. */
export const PUNTO_VENTA_PROGRESO = {
  nombre: "Cooperativa El Progreso R.L.",
  lema: "Al Servicio del Productor",
  convenio:
    "Convenio comercial: Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L. & Coop. El Progreso, R.L.",
  whatsapp: "50765647668",
  whatsappVisible: "+507 6564-7668",
  atencion: "Punto de venta El Progreso · Lunes a sábado",
};

export const PLAZOS_PROGRESO = [3, 4, 6, 8, 10, 12, 18, 24, 36] as const;

export type LineaProgreso = {
  id: string;
  nombre: string;
  modelo: string;
  descripcion: string;
  imagen: string;
  cantidad: string;
  /** Precio de etiqueta que decide El Progreso (contado). */
  precioEtiqueta: string;
};

export type ReglasProgreso = {
  /** Margen manual de crédito en % sobre el precio de etiqueta. */
  margenPct: string;
  /** Tope máximo de plazo (meses) que autoriza El Progreso. */
  plazoTope: string;
};

export type ClienteProgreso = { nombre: string; telefono: string };

export function lineaProgresoVacia(): LineaProgreso {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    modelo: "",
    descripcion: "",
    imagen: "",
    cantidad: "1",
    precioEtiqueta: "",
  };
}

export const fmtGP = (n: number) =>
  "B/. " + (Number.isFinite(n) ? n.toFixed(2) : "0.00").replace(/\B(?=(\d{3})+(?!\d)\.)/g, ",");

export type PlazoProgreso = { meses: number; cuotaMensual: number; letraQuincenal: number };

export type TotalesProgreso = {
  lineas: Array<LineaProgreso & { cantidadNum: number; etiquetaNum: number; subtotal: number; subtotalCredito: number }>;
  totalContado: number;
  totalCredito: number;
  margenPct: number;
  plazoTope: number;
  plazos: PlazoProgreso[];
};

export function calcularProgreso(lineas: LineaProgreso[], reglas: ReglasProgreso): TotalesProgreso {
  const margenPct = Math.max(0, Number(reglas.margenPct) || 0);
  const plazoTope = Math.max(1, Number(reglas.plazoTope) || 1);
  const factor = 1 + margenPct / 100;

  const detalle = lineas.map((l) => {
    const cantidadNum = Math.max(0, Number(l.cantidad) || 0);
    const etiquetaNum = Math.max(0, Number(l.precioEtiqueta) || 0);
    const subtotal = cantidadNum * etiquetaNum;
    return { ...l, cantidadNum, etiquetaNum, subtotal, subtotalCredito: subtotal * factor };
  });

  const totalContado = detalle.reduce((a, l) => a + l.subtotal, 0);
  const totalCredito = detalle.reduce((a, l) => a + l.subtotalCredito, 0);

  const plazos = PLAZOS_PROGRESO.filter((m) => m <= plazoTope).map((meses) => ({
    meses,
    cuotaMensual: totalCredito / meses,
    letraQuincenal: totalCredito / meses / 2,
  }));

  return { lineas: detalle, totalContado, totalCredito, margenPct, plazoTope, plazos };
}

/**
 * Numeración propia: Cotización G&P00000. El correlativo vive en el navegador
 * de El Progreso (no se guarda en la base de datos de GBD Market).
 */
const KEY_CORRELATIVO = "gp_cotizacion_correlativo";

export function siguienteNumeroProgreso(): string {
  let n = 1;
  try {
    const actual = Number(window.localStorage.getItem(KEY_CORRELATIVO) || "0");
    n = (Number.isFinite(actual) ? actual : 0) + 1;
    window.localStorage.setItem(KEY_CORRELATIVO, String(n));
  } catch {
    n = Math.floor(Math.random() * 99999) + 1;
  }
  return "G&P" + String(n).padStart(5, "0");
}
