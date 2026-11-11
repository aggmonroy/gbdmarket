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
