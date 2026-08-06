import { admin } from "./garantias.server";
import { TIPO_TAREA_PREFIJO, type TipoTarea } from "./tareas-shared";

export const hoyISO = () => new Date().toISOString().slice(0, 10);

export async function nombresColaboradores(sb: any) {
  const { data } = await sb.from("colaboradores").select("id,nombre");
  return new Map<string, string>((data ?? []).map((c: any) => [c.id, c.nombre]));
}

/** Genera el número de orden con trazabilidad para cualquier registro. */
export async function generarNumeroTarea(sb: any, tipo: TipoTarea) {
  const { data, error } = await sb.rpc("next_numero_tarea", {
    _fecha: hoyISO(),
    _prefijo: TIPO_TAREA_PREFIJO[tipo],
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/**
 * Crea la tarea pendiente asociada a una solicitud del sitio público
 * (pedidos de línea blanca, bordados, formularios de contacto, etc.)
 * para que el equipo le dé seguimiento con trazabilidad.
 */
export async function crearTareaDeSolicitud(opts: {
  bitacoraId: string;
  numeroPedido: string;
  cliente: string;
  canal: string;
  resumen: string;
}) {
  const sb = await admin();
  const numero = await generarNumeroTarea(sb, "tarea");
  await sb.from("tareas").insert({
    tipo: "tarea",
    numero_orden: numero,
    titulo: `Atender pedido ${opts.numeroPedido} · ${opts.cliente}`,
    descripcion: `${opts.canal === "bordados" ? "Pedido de bordados" : "Pedido de línea blanca"}: ${opts.resumen}`,
    bitacora_id: opts.bitacoraId,
    fecha: hoyISO(),
    estado: "pendiente",
  });
  return numero;
}
