// ============================================================
// MOTOR DE CÁLCULO — replica exacta de las fórmulas del Excel
// (Hoja "DESDE PROVEEDOR", CALCULO_DE_PRECIOS-1.xlsx)
// ============================================================
export const MARGEN = 1.43; // E13 — margen Línea Blanca + ITBMS (fijo, oculto al cliente)
export const ITBMS = 0.07; // 7%
export const MARKUP_CREDITO_ASOCIADO = 1.28; // G26 = G18*1.28
export const MARKUP_CREDITO_TERCERO = 1.48; // P26 = G18*1.48
export const DESC_MAX_ASOCIADO = 0.1; // N16 tope 10%
export const DESC_MAX_TERCERO = 0.07; // N22 tope 7%
export const DESC_MAX_GOBIERNO = 0.1; // tope 10% editable (institucional)
export const PLAZOS = [4, 6, 8, 10, 12, 18, 24] as const;

export type TipoCliente = "asociado" | "colaborador" | "tercero" | "gobierno";

// Colaboradores GBD usan las mismas reglas que asociados,
// pero la promo a precio de etiqueta es a 6 meses (asociado: 3 meses).
export const esAsociado = (t: TipoCliente) => t === "asociado" || t === "colaborador";
export const esGobierno = (t: TipoCliente) => t === "gobierno";
export const mesesPromoContado = (t: TipoCliente) => (t === "colaborador" ? 6 : 3);
export const etiquetaTipoCliente = (t: TipoCliente) =>
  t === "asociado"
    ? "Asociado"
    : t === "colaborador"
      ? "Colaborador GBD"
      : t === "gobierno"
        ? "Gobierno / Institución"
        : "No asociado";

export interface ProductoInput {
  id: string;
  nombre: string;
  precioProveedor: string | number;
  precioEtiqueta: string | number;
  flete: string | number;
  instalacion: string | number;
  descAsociadoPct: number;
  descTerceroPct: number;
  imagen?: string;
  descripcion?: string;
  // Cotización institucional (Gobierno)
  referencia?: string;
  cantidad?: string | number;
  precioUnitario?: string | number;
  descGobiernoPct?: number;
}


export interface ClienteInfo {
  nombre: string;
  cedula: string;
  direccion: string;
  telefono: string;
  correo: string;
}

export interface CapacidadInfo {
  ingreso: number;
  deudaActual: number;
  plazoMeses: number;
  cuotaPropuesta: number;
  topePct: number;
  limiteCuota: number;
  aprueba: boolean;
}

export function clienteVacio(): ClienteInfo {
  return { nombre: "", cedula: "", direccion: "", telefono: "", correo: "" };
}

export function soloDigitos(s: string): string {
  return (s || "").replace(/\D+/g, "");
}

// Panamá país 507. Si el usuario ya lo incluye lo respetamos.
export function telefonoAWhatsapp(tel: string): string {
  const d = soloDigitos(tel);
  if (!d) return "";
  if (d.startsWith("507")) return d;
  return "507" + d;
}

export interface PlazoCuota {
  meses: number;
  cuotaMensual: number;
  letraQuincenal: number;
}

export interface CalculoProducto {
  precioContado: number;
  preSinItbms: number;
  itbmsMonto: number;
  precioCreditoAsociado: number;
  precioCreditoTercero: number;
  descAsociadoPct: number;
  descTerceroPct: number;
  promoAsociado: number;
  facturarAsociado: number;
  promoTercero: number;
  cuota3mContado: number;
  quincenal3mContado: number;
  planAsociado: PlazoCuota[];
  planTercero: PlazoCuota[];
}

export function calcularProducto(p: ProductoInput): CalculoProducto {
  const precioProveedor = Number(p.precioProveedor) || 0;
  const precioEtiqueta = Number(p.precioEtiqueta) || 0;
  const flete = Number(p.flete) || 0;
  const instalacion = Number(p.instalacion) || 0;

  // F13 =IF(B13>0, B13+C13+D13, (A13+C13+D13)*E13)
  const precioContado =
    precioEtiqueta > 0
      ? precioEtiqueta + flete + instalacion
      : (precioProveedor + flete + instalacion) * MARGEN;

  const preSinItbms = precioContado / (1 + ITBMS);
  const itbmsMonto = preSinItbms * ITBMS;

  const precioCreditoAsociado = precioContado * MARKUP_CREDITO_ASOCIADO; // G26
  const precioCreditoTercero = precioContado * MARKUP_CREDITO_TERCERO; // P26

  const descAsociadoPct = Math.min(Number(p.descAsociadoPct) || 0, DESC_MAX_ASOCIADO);
  const descTerceroPct = Math.min(Number(p.descTerceroPct) || 0, DESC_MAX_TERCERO);

  const promoAsociado = precioContado - precioContado * descAsociadoPct; // P16
  const facturarAsociado = promoAsociado / (1 + ITBMS); // P18
  const promoTercero = precioContado - precioContado * descTerceroPct; // P22

  // 6 meses manteniendo precio de contado (solo asociados, capacidad comprobada)
  const cuota3mContado = precioContado / 3; // promo 3 meses a contado (solo asociados)
  const quincenal3mContado = cuota3mContado / 2; // G22

  const planAsociado: PlazoCuota[] = PLAZOS.map((meses) => ({
    meses,
    cuotaMensual: precioCreditoAsociado / meses,
    letraQuincenal: precioCreditoAsociado / meses / 2,
  }));
  const planTercero: PlazoCuota[] = PLAZOS.map((meses) => ({
    meses,
    cuotaMensual: precioCreditoTercero / meses,
    letraQuincenal: precioCreditoTercero / meses / 2,
  }));

  return {
    precioContado,
    preSinItbms,
    itbmsMonto,
    precioCreditoAsociado,
    precioCreditoTercero,
    descAsociadoPct,
    descTerceroPct,
    promoAsociado,
    facturarAsociado,
    promoTercero,
    cuota3mContado,
    quincenal3mContado,
    planAsociado,
    planTercero,
  };
}

export interface CalculadoProducto extends ProductoInput {
  calc: CalculoProducto;
}

export interface Totales {
  precioContado: number;
  promoAsociado: number;
  promoTercero: number;
  cuota3mContado: number;
  mesesPromo: number;
  cuotaPromoContado: number;
  precioCreditoAsociado: number;
  precioCreditoTercero: number;
  planTotal: PlazoCuota[];
}

export function calcularTotales(calculados: CalculadoProducto[], tipoCliente: TipoCliente): Totales {
  const acc = {
    precioContado: 0,
    promoAsociado: 0,
    promoTercero: 0,
    cuota3mContado: 0,
    precioCreditoAsociado: 0,
    precioCreditoTercero: 0,
  };
  calculados.forEach(({ calc }) => {
    acc.precioContado += calc.precioContado;
    acc.promoAsociado += calc.promoAsociado;
    acc.promoTercero += calc.promoTercero;
    acc.cuota3mContado += calc.cuota3mContado;
    acc.precioCreditoAsociado += calc.precioCreditoAsociado;
    acc.precioCreditoTercero += calc.precioCreditoTercero;
  });
  const creditoTotal = esAsociado(tipoCliente) ? acc.precioCreditoAsociado : acc.precioCreditoTercero;
  const planTotal: PlazoCuota[] = PLAZOS.map((meses) => ({
    meses,
    cuotaMensual: creditoTotal / meses,
    letraQuincenal: creditoTotal / meses / 2,
  }));
  const mesesPromo = mesesPromoContado(tipoCliente);
  return { ...acc, planTotal, mesesPromo, cuotaPromoContado: acc.precioContado / mesesPromo };
}

export const fmt = (n: number) =>
  "B/. " + (Number.isFinite(n) ? n.toFixed(2) : "0.00").replace(/\B(?=(\d{3})+(?!\d)\.)/g, ",");

export const pct = (n: number) => (n * 100).toFixed(1) + "%";

export function nuevoProducto(): ProductoInput {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    precioProveedor: "",
    precioEtiqueta: "",
    flete: "0",
    instalacion: "0",
    descAsociadoPct: DESC_MAX_ASOCIADO,
    descTerceroPct: DESC_MAX_TERCERO,
    imagen: "",
    descripcion: "",
  };
}
