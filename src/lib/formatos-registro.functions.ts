import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin, requireAdminSesion, verifySesion, type Sesion } from "./garantias.server";
import { generarNumeroTarea, nombresColaboradores } from "./tareas.server";
import {
  ACCION_DOCUMENTO_LABEL,
  MAX_CONTENIDO_DOCUMENTO,
  accionDocumentoSchema,
  documentoIdSchema,
  estadoTrasAccion,
  hoyPanama,
  listarRegistroSchema,
  puedeResolverDocumentos,
  puedeSolicitarAnulacion,
  registrarEmisionSchema,
  resolverSolicitudDocumentoSchema,
  veTodoElRegistro,
  type AccionDocumento,
} from "./formatos-registro";

const COLUMNAS_LISTA =
  "id,numero,formato,clave,titulo,fecha,emitido_por,estado,impresiones,resuelto_en,resuelto_por,motivo_resolucion,created_at,updated_at";


async function documentoVisible(sb: any, s: Sesion, id: string, columnas = "*") {
  const { data, error } = await sb.from("formato_documentos").select(columnas).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Documento no encontrado");
  if (!veTodoElRegistro(s.rol) && data.emitido_por !== s.cid) throw new Error("Documento no encontrado");
  if (data.estado === "eliminado" && !puedeResolverDocumentos(s.rol)) throw new Error("Documento no encontrado");
  return data;
}

/** Registra un documento al imprimirlo o descargarlo (o cuenta una reimpresión). */
export const registrarEmision = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrarEmisionSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    const contenido = JSON.stringify(data.datos ?? {});
    if (contenido.length > MAX_CONTENIDO_DOCUMENTO) {
      throw new Error("El documento es demasiado grande para guardarlo; quita algunas fotos anexas.");
    }
    const hoy = hoyPanama();

    if (data.id && data.accion !== "crear") {
      const doc = await documentoVisible(sb, s, data.id, "id,numero,estado,emitido_por,fecha,impresiones");
      if (doc.estado !== "vigente") throw new Error("Este documento está anulado; no se puede volver a emitir.");
      const propio = doc.emitido_por === s.cid && doc.fecha === hoy;
      if (data.accion === "reimprimir" || propio) {
        const patch: Record<string, unknown> = { impresiones: (doc.impresiones ?? 1) + 1 };
        if (data.accion === "actualizar") patch.datos = data.datos ?? {};
        const { error } = await sb.from("formato_documentos").update(patch).eq("id", doc.id);
        if (error) throw new Error(error.message);
        return { id: doc.id as string, numero: doc.numero as string, nuevo: false };
      }
      // Un documento de otro día u otra persona no se modifica: se emite uno nuevo.
    }

    for (let intento = 0; intento < 4; intento++) {
      const { data: numero, error: e1 } = await sb.rpc("next_numero_documento", { _fecha: hoy });
      if (e1) throw new Error(e1.message);
      const sufijo = intento ? `-${intento}` : "";
      const { data: fila, error } = await sb
        .from("formato_documentos")
        .insert({
          numero: `${numero}${sufijo}`,
          formato: data.formato,
          clave: data.clave,
          titulo: data.titulo,
          fecha: hoy,
          datos: data.datos ?? {},
          emitido_por: s.cid,
        })
        .select("id,numero")
        .single();
      if (!error) return { id: fila.id as string, numero: fila.numero as string, nuevo: true };
      if (error.code !== "23505") throw new Error(error.message);
    }
    throw new Error("No se pudo numerar el documento; intenta de nuevo.");
  });

/** Registro diario: documentos emitidos en el rango de fechas, sin su contenido. */
export const listarRegistro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listarRegistroSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    let q = sb
      .from("formato_documentos")
      .select(COLUMNAS_LISTA)
      .gte("fecha", data.desde)
      .lte("fecha", data.hasta)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (!veTodoElRegistro(s.rol)) q = q.eq("emitido_por", s.cid);
    if (!(data.incluirEliminados && puedeResolverDocumentos(s.rol))) q = q.neq("estado", "eliminado");
    if (data.q) {
      const t = data.q.replace(/[%,()]/g, " ");
      q = q.or(`numero.ilike.%${t}%,titulo.ilike.%${t}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: any) => r.id);
    const { data: sols } = ids.length
      ? await sb
          .from("formato_documento_solicitudes")
          .select("id,documento_id,accion,motivo,solicitado_por,solicitado_en")
          .in("documento_id", ids)
          .eq("estado", "pendiente")
      : { data: [] as any[] };
    const nombres = await nombresColaboradores(sb);
    const nombre = (id: string | null) => (id ? nombres.get(id) ?? "—" : "—");
    return (rows ?? []).map((r: any) => {
      const sol = (sols ?? []).find((x: any) => x.documento_id === r.id) ?? null;
      return {
        ...r,
        emitido_por_nombre: nombre(r.emitido_por),
        resuelto_por_nombre: r.resuelto_por ? nombre(r.resuelto_por) : null,
        solicitud: sol ? { ...sol, solicitado_por_nombre: nombre(sol.solicitado_por) } : null,
      };
    });
  });

/** Contenido completo de un documento para consultarlo o reimprimirlo. */
export const abrirDocumento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => documentoIdSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    const doc = await documentoVisible(sb, s, data.id);
    return doc as {
      id: string;
      numero: string;
      formato: string;
      clave: string;
      titulo: string;
      fecha: string;
      estado: "vigente" | "anulado" | "eliminado";
      datos: { borrador?: any; anexos?: { id: string; src: string; nota: string }[] } | null;
    };
  });

async function aplicarAccion(sb: any, docId: string, accion: AccionDocumento, adminId: string, motivo: string) {
  const { error } = await sb
    .from("formato_documentos")
    .update({
      estado: estadoTrasAccion(accion),
      resuelto_en: new Date().toISOString(),
      resuelto_por: adminId,
      motivo_resolucion: motivo,
    })
    .eq("id", docId);
  if (error) throw new Error(error.message);
}

/** Cierra la tarea del admin ligada a la solicitud. */
async function cerrarTareaSolicitud(sb: any, solicitudId: string, s: Sesion, etiqueta: string) {
  const ahora = new Date().toISOString();
  await sb
    .from("tareas")
    .update({
      estado: "finalizada",
      finalizada_responsable_en: ahora,
      cerrada_en: ahora,
      completada_en: hoyPanama(),
      completada_por: s.cid,
      resultado_cierre: etiqueta,
      nota_cierre: `${s.nombre}: ${etiqueta}`,
    })
    .eq("formato_solicitud_id", solicitudId)
    .neq("estado", "finalizada");
}

/**
 * Pide anular o eliminar un documento. El admin lo hace directamente;
 * los demás crean una solicitud que queda como tarea pendiente del admin.
 */
export const solicitarAccionDocumento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => accionDocumentoSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    const doc = await documentoVisible(sb, s, data.id, "id,numero,titulo,estado,emitido_por");
    if (doc.estado === "eliminado") throw new Error("El documento ya fue eliminado");
    if (doc.estado === "anulado" && data.accion === "anular") throw new Error("El documento ya está anulado");

    if (puedeResolverDocumentos(s.rol)) {
      await aplicarAccion(sb, doc.id, data.accion, s.cid, data.motivo);
      const { data: pendientes } = await sb
        .from("formato_documento_solicitudes")
        .select("id")
        .eq("documento_id", doc.id)
        .eq("estado", "pendiente");
      for (const p of pendientes ?? []) {
        await sb
          .from("formato_documento_solicitudes")
          .update({ estado: "aprobada", resuelto_por: s.cid, resuelto_en: new Date().toISOString(), nota_resolucion: data.motivo })
          .eq("id", p.id);
        await cerrarTareaSolicitud(sb, p.id, s, `${ACCION_DOCUMENTO_LABEL[data.accion]} aplicada`);
      }
      return { aplicado: true };
    }

    if (!puedeSolicitarAnulacion(s.rol)) throw new Error("La gerencia tiene acceso de solo lectura");
    const { data: sol, error } = await sb
      .from("formato_documento_solicitudes")
      .insert({ documento_id: doc.id, accion: data.accion, motivo: data.motivo, solicitado_por: s.cid })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Ya hay una solicitud pendiente para este documento");
      throw new Error(error.message);
    }
    const { data: admins } = await sb
      .from("colaboradores")
      .select("id")
      .eq("rol", "admin")
      .eq("activo", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1);
    const numeroTarea = await generarNumeroTarea(sb, "tarea");
    const etiqueta = ACCION_DOCUMENTO_LABEL[data.accion as AccionDocumento];
    const { error: e2 } = await sb.from("tareas").insert({
      tipo: "tarea",
      origen: "documentos",
      numero_orden: numeroTarea,
      titulo: `${etiqueta} de ${doc.numero} · ${doc.titulo}`.slice(0, 200),
      descripcion: `Solicitado por ${s.nombre}. Motivo: ${data.motivo}`,
      asignado_a: admins?.[0]?.id ?? null,
      creado_por: s.cid,
      formato_solicitud_id: sol.id,
      fecha: hoyPanama(),
      estado: "pendiente",
    });
    if (e2) {
      await sb.from("formato_documento_solicitudes").delete().eq("id", sol.id);
      throw new Error(e2.message);
    }
    return { aplicado: false };
  });

/** Solicitudes de anulación o eliminación pendientes (solo admin). */
export const listarSolicitudesDocumentos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => documentoIdSchema.pick({ token: true }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminSesion(data.token);
    const sb = await admin();
    const { data: sols, error } = await sb
      .from("formato_documento_solicitudes")
      .select("*")
      .eq("estado", "pendiente")
      .order("solicitado_en", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (sols ?? []).map((x: any) => x.documento_id);
    const { data: docs } = ids.length
      ? await sb.from("formato_documentos").select(COLUMNAS_LISTA).in("id", ids)
      : { data: [] as any[] };
    const nombres = await nombresColaboradores(sb);
    return (sols ?? []).map((x: any) => {
      const doc = (docs ?? []).find((d: any) => d.id === x.documento_id) ?? null;
      return {
        ...x,
        solicitado_por_nombre: x.solicitado_por ? nombres.get(x.solicitado_por) ?? "—" : "—",
        documento: doc ? { ...doc, emitido_por_nombre: doc.emitido_por ? nombres.get(doc.emitido_por) ?? "—" : "—" } : null,
      };
    });
  });

/** El admin verifica y aprueba o rechaza la solicitud; la tarea queda cerrada. */
export const resolverSolicitudDocumento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => resolverSolicitudDocumentoSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireAdminSesion(data.token);
    const sb = await admin();
    const { data: sol, error } = await sb
      .from("formato_documento_solicitudes")
      .select("*")
      .eq("id", data.solicitud_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sol || sol.estado !== "pendiente") throw new Error("La solicitud ya fue resuelta");
    const accion = sol.accion as AccionDocumento;
    if (data.aprobar) await aplicarAccion(sb, sol.documento_id, accion, s.cid, sol.motivo);
    const { error: e2 } = await sb
      .from("formato_documento_solicitudes")
      .update({
        estado: data.aprobar ? "aprobada" : "rechazada",
        resuelto_por: s.cid,
        resuelto_en: new Date().toISOString(),
        nota_resolucion: data.nota || null,
      })
      .eq("id", sol.id);
    if (e2) throw new Error(e2.message);
    await cerrarTareaSolicitud(
      sb,
      sol.id,
      s,
      `${ACCION_DOCUMENTO_LABEL[accion]} ${data.aprobar ? "aprobada" : "rechazada"}${data.nota ? ` · ${data.nota}` : ""}`,
    );
    return { ok: true };
  });

/** Traslados vigentes para el inventario consolidado por sucursal. */
export const listarTrasladosInventario = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("formato_documentos")
      .select("numero,fecha,datos")
      .in("formato", ["traslado-linea-blanca", "traslado-progreso"])
      .eq("estado", "vigente")
      .order("fecha", { ascending: true })
      .limit(5000);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => {
      const b = r.datos?.borrador ?? {};
      return {
        numero: r.numero as string,
        fecha: r.fecha as string,
        origen: String(b.origen ?? ""),
        destino: String(b.destino ?? ""),
        lineas: (Array.isArray(b.lineas) ? b.lineas : []).map((l: any) => ({
          articulo: String(l?.articulo ?? ""),
          cantidad: String(l?.cantidad ?? ""),
          codigo: String(l?.codigo ?? ""),
          precio: String(l?.precio ?? ""),
        })),
      };
    });
  });
