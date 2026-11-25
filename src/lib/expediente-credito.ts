import { datosClienteInicial, declaracionInicial, type DatosCliente, type Declaracion } from "@/lib/formatos";

/**
 * Expediente de crédito: datos del cliente, APC, Ley 81 y declaración de ingresos en un solo
 * documento. Todo se llena desde la toma de datos del cliente (nombre, cédula, fecha, # cliente).
 */
export type SeccionExpediente = "cliente" | "apc" | "ley81" | "declaracion";

export const SECCIONES_EXPEDIENTE: { id: SeccionExpediente; titulo: string; pagina: number }[] = [
  { id: "cliente", titulo: "Datos del cliente", pagina: 1 },
  { id: "apc", titulo: "Autorización de APC", pagina: 1 },
  { id: "ley81", titulo: "Autorización de uso de datos (Ley 81)", pagina: 2 },
  { id: "declaracion", titulo: "Declaración de ingresos", pagina: 3 },
];

export type Expediente = {
  cliente: DatosCliente;
  declaracion: Declaracion;
  lugar: string;
  incluir: Record<SeccionExpediente, boolean>;
};

export function expedienteInicial(): Expediente {
  return {
    cliente: datosClienteInicial(),
    declaracion: declaracionInicial(),
    lugar: "Las Tablas",
    incluir: { cliente: true, apc: true, ley81: true, declaracion: true },
  };
}

/** Páginas a imprimir: datos del cliente y APC comparten la primera; cada otra va en su propia hoja. */
export function paginasExpediente(incluir: Record<SeccionExpediente, boolean>): SeccionExpediente[][] {
  const paginas = new Map<number, SeccionExpediente[]>();
  for (const s of SECCIONES_EXPEDIENTE) {
    if (!incluir[s.id]) continue;
    paginas.set(s.pagina, [...(paginas.get(s.pagina) ?? []), s.id]);
  }
  return [...paginas.values()];
}

export const direccionCliente = (c: DatosCliente) =>
  [c.barriada, c.comunidad, c.corregimiento, c.distrito, c.provincia].map((x) => x.trim()).filter(Boolean).join(", ");

export const numeroDeCliente = (c: DatosCliente) => c.numeroCliente || c.numeroAsociado;

export const vistaApc = (e: Expediente) => ({ nombre: e.cliente.nombre, cedula: e.cliente.cedula });

export const vistaLey81 = (e: Expediente) => ({
  lugar: e.lugar,
  fecha: e.cliente.fecha,
  nombre: e.cliente.nombre,
  cedula: e.cliente.cedula,
});

export const vistaDeclaracion = (e: Expediente): Declaracion => ({
  ...e.declaracion,
  fecha: e.cliente.fecha,
  nombre: e.cliente.nombre,
  cedula: e.cliente.cedula,
  numeroCliente: numeroDeCliente(e.cliente),
  direccion: e.declaracion.direccion || direccionCliente(e.cliente),
});

/** Lo escrito en cualquier documento vuelve a la toma de datos del cliente. */
export function aplicarComunes(
  e: Expediente,
  v: Partial<{ nombre: string; cedula: string; fecha: string; numeroCliente: string; lugar: string }>,
): Expediente {
  const cliente = { ...e.cliente };
  if (v.nombre !== undefined) cliente.nombre = v.nombre;
  if (v.cedula !== undefined) cliente.cedula = v.cedula;
  if (v.fecha !== undefined) cliente.fecha = v.fecha;
  if (v.numeroCliente !== undefined && v.numeroCliente !== numeroDeCliente(e.cliente)) cliente.numeroCliente = v.numeroCliente;
  return { ...e, cliente, lugar: v.lugar ?? e.lugar };
}
