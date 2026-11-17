/** Datos editables del formato "Orden de combustible" (no se guardan en la base de datos). */
export type OrdenCombustible = {
  fecha: string; // YYYY-MM-DD
  vehiculo: string;
  placa: string;
  preparadoPor: string;
  conductor: string;
  autorizadoPor: string;
};

/** Valores fijos del formato original. */
export const ORDEN_COMBUSTIBLE_FIJO = {
  estacion: "ESTACION EL ESFUERZO",
  combustible: "Diésel",
  telefonos: "994-6271 / 994-7184",
} as const;

export const ORDEN_COMBUSTIBLE_DEFAULTS: Omit<OrdenCombustible, "fecha"> = {
  vehiculo: "FRONTIER",
  placa: "913951",
  preparadoPor: "Ana Gomez",
  conductor: "Sebastian Taylor",
  autorizadoPor: "Elena Moreno",
};

export type EstacionId = "el-esfuerzo" | "el-progreso";

export type EstacionConfig = {
  titulo: string;
  /** Destinatario de la orden ("Señores: …"). */
  estacion: string;
  combustible: string;
  /** Línea de sección bajo la fecha (solo en algunos formatos). */
  seccion?: string;
  /** El formato lleva firma del conductor. */
  conductor: boolean;
  archivo: string;
  storageKey: string;
  defaults: Omit<OrdenCombustible, "fecha">;
};

/** Cada estación usa su propio formato (ORDEN DE COMBUSTIBLE.pdf y ORDEN_DE_COMBUSTIBLE_EL_PROGRESO.xlsx). */
export const ESTACIONES: Record<EstacionId, EstacionConfig> = {
  "el-esfuerzo": {
    titulo: "Estación El Esfuerzo",
    estacion: ORDEN_COMBUSTIBLE_FIJO.estacion,
    combustible: ORDEN_COMBUSTIBLE_FIJO.combustible,
    conductor: true,
    archivo: "estacion-el-esfuerzo",
    storageKey: "gbd_formato_orden_combustible",
    defaults: ORDEN_COMBUSTIBLE_DEFAULTS,
  },
  "el-progreso": {
    titulo: "Estación El Progreso",
    estacion: "COOPERATIVA EL PROGRESO, R.L.",
    combustible: "DIESEL",
    seccion: "Sección Linea Blanca",
    conductor: false,
    archivo: "estacion-el-progreso",
    storageKey: "gbd_formato_orden_combustible_el_progreso",
    defaults: {
      vehiculo: "NISSAN FRONTIER",
      placa: "913951",
      preparadoPor: "",
      conductor: "",
      autorizadoPor: "Elena Moreno",
    },
  },
};

/** Periodo fiscal (agosto–julio) al que pertenece la fecha, p. ej. "2026-2027". */
export function periodoFiscal(fecha: string): string {
  const [y, m] = fecha.split("-").map(Number);
  if (!y || !m) return "";
  const inicio = m >= 8 ? y : y - 1;
  return `${inicio}-${inicio + 1}`;
}

/** "miércoles, 11 de noviembre de 2026" */
export function fechaLarga(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
