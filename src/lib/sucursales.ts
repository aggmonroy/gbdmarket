/**
 * Sucursales de la mueblería. Sirve para distinguir las cotizaciones y los
 * trámites de garantía por punto de venta.
 */
export const SUCURSALES = ["las-tablas", "tonosi"] as const;

export type Sucursal = (typeof SUCURSALES)[number];

export const SUCURSAL_LABEL: Record<Sucursal, string> = {
  "las-tablas": "Sucursal Las Tablas",
  tonosi: "Sucursal Tonosí",
};

/** Responsable fijo de la sucursal de Tonosí (asignación automática). */
export const RESPONSABLE_TONOSI = "VICTOR";
