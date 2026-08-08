/** Umbral (en días) sin contacto a partir del cual el caso se marca en alerta. */
export const DIAS_ALERTA_SIN_CONTACTO = 7;

export const ESTADOS_ABIERTOS = ["proceso", "revision"] as const;
export const ESTADOS_CERRADOS = ["cerrada_cliente_credito", "cerrada_proveedor_cliente"] as const;

export type GarantiaEstado =
  | "proceso"
  | "revision"
  | "cerrada_cliente_credito"
  | "cerrada_proveedor_cliente";

export type GarantiaVia =
  | "Personalmente"
  | "A domicilio"
  | "WhatsApp"
  | "Llamada"
  | "Correo electrónico"
  | "Otro";
export type ColaboradorRol = "colaborador" | "admin" | "gerente";

export const ESTADO_LABEL: Record<GarantiaEstado, string> = {
  proceso: "En proceso",
  revision: "Pendiente de validación",
  cerrada_cliente_credito: "Cerrada — cliente / crédito",
  cerrada_proveedor_cliente: "Cerrada — proveedor / cliente",
};

export const VIAS: GarantiaVia[] = [
  "Personalmente",
  "A domicilio",
  "WhatsApp",
  "Llamada",
  "Correo electrónico",
  "Otro",
];

export const COLOR_CIERRE: Record<string, string> = {
  cerrada_cliente_credito: "#2563eb",
  cerrada_proveedor_cliente: "#16a34a",
};

export function diasEntre(desde: string | Date, hasta: Date = new Date()): number {
  const d = typeof desde === "string" ? new Date(`${desde.slice(0, 10)}T00:00:00`) : desde;
  const h = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((h.getTime() - base.getTime()) / 86400000));
}

export type Antiguedad = {
  diasAbierta: number;
  diasSinContacto: number;
  ultimoContacto: string | null;
  enAlerta: boolean;
};

export function calcularAntiguedad(fecha: string, ultimoContacto: string | null): Antiguedad {
  const diasAbierta = diasEntre(fecha);
  const diasSinContacto = ultimoContacto ? diasEntre(ultimoContacto) : diasAbierta;
  return {
    diasAbierta,
    diasSinContacto,
    ultimoContacto,
    enAlerta: diasSinContacto > DIAS_ALERTA_SIN_CONTACTO,
  };
}

export const TEXTO_SIGUIENTE_PASO_CAMBIO =
  "Dado que el artículo se encuentra dentro de los primeros 15 días posteriores a la compra y, tras el examen físico y visual realizado, se determinó que el desperfecto no se debe a mal uso, se procederá con el cambio del artículo conforme a lo establecido.";

export const TEXTO_SIGUIENTE_PASO_PROVEEDOR =
  "Se obtendrá una respuesta del proveedor en un plazo de 8 a 15 días hábiles. Posteriormente, cualquier cambio, en caso de que el taller del proveedor lo autorice, se realizará en el momento en que la marca emita el reporte de autorización por escrito para el cambio correspondiente.";

export const TEXTO_CONSENTIMIENTO =
  "Declaro que he sido informado(a) de cómo se realiza este trámite de garantía y que estoy de acuerdo con lo descrito en este reporte, incluyendo las fotos o imágenes aquí colocadas como justificación del caso.";

export function siguientePaso(dentro15: boolean, noMalUso: boolean): string {
  return dentro15 && noMalUso ? TEXTO_SIGUIENTE_PASO_CAMBIO : TEXTO_SIGUIENTE_PASO_PROVEEDOR;
}

/** CSV con BOM UTF-8 para que Excel respete tildes y eñes. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "\uFEFF" + [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
}

export function descargarArchivo(nombre: string, contenido: string, tipo = "text/csv;charset=utf-8") {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
