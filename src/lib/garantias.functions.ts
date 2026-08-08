import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  admin,
  garantiaCompleta,
  hashPin,
  randomSalt,
  requireAdminSesion,
  requireEscritura,
  resumenAbiertas,
  signSesion,
  verificarPinColaborador,
  verificarPinPorCedula,
  verifySesion,
  signReporteToken,
  verifyReporteToken,
} from "./garantias.server";
import {
  cierreSchema,
  colaboradorSchema,
  crearGarantiaSchema,
  evidenciaSchema,
  facturaIaSchema,
  idTokenSchema,
  loginCedulaSchema,
  loginSchema,
  resolverPinSchema,
  seguimientoSchema,
  solicitudPinSchema,
  solicitudPinCedulaSchema,
  tokenSchema,
} from "./garantias.schemas";

/** Lista mínima de colaboradores activos para la pantalla de ingreso por PIN. */
export const listColaboradoresLogin = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("colaboradores")
    .select("id,nombre,rol,pin_bloqueado")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const loginConPin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginSchema.parse(d))
  .handler(async ({ data }) => {
    const c = await verificarPinColaborador(data.colaborador_id, data.pin);
    const token = await signSesion({ cid: c.id, rol: c.rol, nombre: c.nombre });
    return { token, colaborador: { id: c.id, nombre: c.nombre, rol: c.rol } };
  });

/** Ingreso al portal con cédula + PIN, con opción de mantener la sesión. */
export const loginConCedula = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginCedulaSchema.parse(d))
  .handler(async ({ data }) => {
    const c = await verificarPinPorCedula(data.cedula, data.pin);
    const token = await signSesion({ cid: c.id, rol: c.rol, nombre: c.nombre }, data.recordar ? 24 * 30 : 12);
    return { token, colaborador: { id: c.id, nombre: c.nombre, rol: c.rol }, recordar: data.recordar };
  });

/** Autoservicio: el colaborador verifica su cédula y deja el nuevo PIN pendiente de aprobación. */
export const solicitarCambioPin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => solicitudPinSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: c } = await sb
      .from("colaboradores")
      .select("id,cedula,activo,deleted_at")
      .eq("id", data.colaborador_id)
      .maybeSingle();
    if (!c || !c.activo || c.deleted_at) throw new Error("Colaborador no disponible");
    if (!c.cedula) throw new Error("No tienes cédula registrada. Pide al administrador que fije tu PIN.");
    if (c.cedula.replace(/\s/g, "") !== data.cedula.replace(/\s/g, "")) throw new Error("La cédula no coincide");
    const salt = randomSalt();
    const hash = await hashPin(data.nuevo_pin, salt);
    const { error } = await sb.from("colaborador_pin_solicitudes").insert({
      colaborador_id: c.id,
      nuevo_pin_hash: hash,
      nuevo_pin_salt: salt,
    });
    if (error) throw new Error("Ya tienes una solicitud pendiente de aprobación");
    await sb.from("colaboradores").update({ pin_bloqueado: true }).eq("id", c.id);
    return { ok: true };
  });

/** Solicitud de cambio de PIN desde el portal de colaboradores (solo cédula). */
export const solicitarCambioPinPorCedula = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => solicitudPinCedulaSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const norm = (v: string) => v.replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
    const { data: lista } = await sb
      .from("colaboradores")
      .select("id,cedula")
      .eq("activo", true)
      .is("deleted_at", null);
    const c = (lista ?? []).find((x: any) => x.cedula && norm(x.cedula) === norm(data.cedula));
    if (!c) throw new Error("No encontramos una cuenta con esa cédula");
    const salt = randomSalt();
    const hash = await hashPin(data.nuevo_pin, salt);
    const { error } = await sb.from("colaborador_pin_solicitudes").insert({
      colaborador_id: c.id,
      nuevo_pin_hash: hash,
      nuevo_pin_salt: salt,
    });
    if (error) throw new Error("Ya tienes una solicitud pendiente de aprobación");
    await sb.from("colaboradores").update({ pin_bloqueado: true }).eq("id", c.id);
    return { ok: true };
  });

export const numeroGarantiaPreview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(1), fecha: z.string().min(10).max(10) }).parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    const sb = await admin();
    const { data: rows } = await sb
      .from("garantias")
      .select("numero_garantia")
      .order("creado_en", { ascending: false })
      .limit(1);
    const ultimo = rows?.[0]?.numero_garantia as string | undefined;
    const siguiente = ultimo ? Number(ultimo.slice(-4)) + 1 : 0;
    return `${data.fecha}-${String(siguiente).padStart(4, "0")}`;
  });

export const crearGarantia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => crearGarantiaSchema.parse(d))
  .handler(async ({ data }) => {
    const sesion = await requireEscritura(data.token);
    await verificarPinColaborador(sesion.cid, data.pin);
    const sb = await admin();
    const { data: numero, error: numError } = await sb.rpc("next_numero_garantia", { _fecha: data.fecha });
    if (numError) throw new Error(numError.message);
    const { data: garantia, error } = await sb
      .from("garantias")
      .insert({
        numero_garantia: numero,
        fecha: data.fecha,
        cliente: data.cliente,
        cedula_cliente: data.cedula_cliente || null,
        telefono_cliente: data.telefono_cliente || null,
        direccion_cliente: data.direccion_cliente || null,
        numero_factura: data.numero_factura || null,
        fecha_facturacion: data.fecha_facturacion || null,
        modelo_codigo: data.modelo_codigo || null,
        descripcion_articulo: data.descripcion_articulo || null,
        dentro_15_dias: data.dentro_15_dias,
        no_mal_uso: data.dentro_15_dias ? data.no_mal_uso : false,
        accion_realizada: data.accion_realizada || null,
        estado: "proceso",
        tramitado_por: sesion.cid,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const { data: tarea } = await sb
      .from("tareas")
      .insert({
        titulo: `Seguimiento de garantía: ${data.cliente}`,
        descripcion: `Garantía ${numero}`,
        asignado_a: sesion.cid,
        garantia_id: garantia.id,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (tarea?.id) await sb.from("garantias").update({ tarea_vinculada_id: tarea.id }).eq("id", garantia.id);
    return {
      id: garantia.id as string,
      numero_garantia: numero as string,
      reporte_token: await signReporteToken(garantia.id as string),
    };
  });

export const listGarantiasAbiertas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    return resumenAbiertas(["proceso", "revision"]);
  });

export const listBitacoraCerradas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    return resumenAbiertas(["cerrada_cliente_credito", "cerrada_proveedor_cliente"]);
  });

export const getGarantia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idTokenSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    return garantiaCompleta(data.garantia_id);
  });

export const agregarSeguimiento = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => seguimientoSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireEscritura(data.token);
    const sb = await admin();
    const { error } = await sb.from("garantia_seguimientos").insert({
      garantia_id: data.garantia_id,
      fecha: data.fecha,
      via: data.via,
      texto: data.texto,
      creado_por: s.cid,
    });
    if (error) throw new Error(error.message);
    return { ok: true, reporte_token: await signReporteToken(data.garantia_id) };
  });

/** Reporte imprimible: se abre con el enlace firmado, sin volver a pedir PIN. */
export const getGarantiaReporte = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ garantia_id: z.string().uuid(), rt: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    await verifyReporteToken(data.rt, data.garantia_id);
    return garantiaCompleta(data.garantia_id);
  });

/** Enlace de impresión para una garantía ya existente (requiere sesión con PIN). */
export const reporteTokenGarantia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idTokenSchema.parse(d))
  .handler(async ({ data }) => {
    await verifySesion(data.token);
    return { reporte_token: await signReporteToken(data.garantia_id) };
  });

export const subirEvidencia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => evidenciaSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireEscritura(data.token);
    const sb = await admin();
    const bytes = Uint8Array.from(atob(data.base64), (ch) => ch.charCodeAt(0));
    const ext = (data.filename.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const path = `${data.garantia_id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sb.storage
      .from("garantia-evidencias")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { error } = await sb
      .from("garantia_evidencias")
      .insert({ garantia_id: data.garantia_id, url_imagen: path, subido_por: s.cid });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const solicitarCierre = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cierreSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireEscritura(data.token);
    const sb = await admin();
    const { error } = await sb.from("garantia_cierre_solicitud").insert({
      garantia_id: data.garantia_id,
      tipo_propuesto: data.tipo_propuesto,
      nota_final: data.nota_final || null,
      numero_documento_subsanacion: data.numero_documento_subsanacion || null,
      solicitado_por: s.cid,
    });
    if (error) throw new Error("Ya existe una solicitud de cierre pendiente para este caso");
    await sb.from("garantias").update({ estado: "revision" }).eq("id", data.garantia_id);
    return { ok: true };
  });

export const listSolicitudesCierre = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdminSesion(data.token);
    const sb = await admin();
    const { data: sols, error } = await sb
      .from("garantia_cierre_solicitud")
      .select("*")
      .eq("estado", "pendiente")
      .order("solicitado_en", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (sols ?? []).map((s: any) => s.garantia_id);
    const { data: gs } = ids.length ? await sb.from("garantias").select("*").in("id", ids) : { data: [] as any[] };
    const { data: colabs } = await sb.from("colaboradores").select("id,nombre");
    const nombre = (id: string) => (colabs ?? []).find((c: any) => c.id === id)?.nombre ?? "—";
    return (sols ?? []).map((s: any) => ({
      ...s,
      solicitado_por_nombre: nombre(s.solicitado_por),
      garantia: (gs ?? []).find((g: any) => g.id === s.garantia_id) ?? null,
    }));
  });

export const validarCierre = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idTokenSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireAdminSesion(data.token);
    const sb = await admin();
    const { data: sol } = await sb
      .from("garantia_cierre_solicitud")
      .select("*")
      .eq("garantia_id", data.garantia_id)
      .eq("estado", "pendiente")
      .maybeSingle();
    if (!sol) throw new Error("No hay solicitud de cierre pendiente");
    const hoy = new Date().toISOString().slice(0, 10);
    await sb.from("garantias").update({ estado: sol.tipo_propuesto, fecha_cierre: hoy }).eq("id", data.garantia_id);
    await sb
      .from("garantia_cierre_solicitud")
      .update({ estado: "aprobada", resuelto_en: new Date().toISOString(), resuelto_por: s.cid })
      .eq("id", sol.id);
    await sb
      .from("tareas")
      .update({ estado: "completada", completada_en: hoy })
      .eq("garantia_id", data.garantia_id);
    return { ok: true };
  });

export const rechazarCierre = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idTokenSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireAdminSesion(data.token);
    const sb = await admin();
    await sb
      .from("garantia_cierre_solicitud")
      .update({ estado: "rechazada", resuelto_en: new Date().toISOString(), resuelto_por: s.cid })
      .eq("garantia_id", data.garantia_id)
      .eq("estado", "pendiente");
    await sb.from("garantias").update({ estado: "proceso" }).eq("id", data.garantia_id);
    return { ok: true };
  });

export const misTareasPendientes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await verifySesion(data.token);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("tareas")
      .select("*")
      .eq("asignado_a", s.cid)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Lectura asistida de la factura: propone campos, nunca guarda sin confirmación. */
export const leerFacturaIA = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => facturaIaSchema.parse(d))
  .handler(async ({ data }) => {
    await requireEscritura(data.token);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("La lectura con IA no está disponible");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Extraes datos de facturas de electrodomésticos. Responde SOLO un JSON con las claves cliente, cedula_cliente, telefono_cliente, direccion_cliente, numero_factura, fecha_facturacion (AAAA-MM-DD), modelo_codigo, descripcion_articulo. Usa cadena vacía si no aparece el dato.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae los datos de esta factura." },
              data.contentType.includes("pdf")
                ? {
                    type: "file",
                    file: {
                      filename: data.filename ?? "factura.pdf",
                      file_data: `data:${data.contentType};base64,${data.base64}`,
                    },
                  }
                : { type: "image_url", image_url: { url: `data:${data.contentType};base64,${data.base64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error("No se pudo leer la factura");
    const json: any = await res.json();
    const texto: string = json?.choices?.[0]?.message?.content ?? "{}";
    const match = texto.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(match ? match[0] : "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  });

/* ---------- Gestión de colaboradores desde el panel /admin (sesión Supabase) ---------- */

export const listColaboradoresAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const sb = await admin();
    const { data: colaboradores } = await sb
      .from("colaboradores")
      // Nunca enviar pin_hash / pin_salt al navegador.
      .select("id,nombre,cedula,rol,pin_bloqueado,activo,created_at,updated_at")
      .is("deleted_at", null)
      .order("nombre");
    const { data: solicitudes } = await sb
      .from("colaborador_pin_solicitudes")
      // Sin nuevo_pin_hash / nuevo_pin_salt.
      .select("id,colaborador_id,estado,solicitado_en,resuelto_en,resuelto_por")
      .eq("estado", "pendiente")
      .order("solicitado_en");
    return { colaboradores: colaboradores ?? [], solicitudes: solicitudes ?? [] };
  });

export const guardarColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => colaboradorSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const sb = await admin();
    const payload: Record<string, any> = {
      nombre: data.nombre,
      cedula: data.cedula || null,
      rol: data.rol,
      activo: data.activo,
    };
    if (data.pin) {
      const salt = randomSalt();
      payload.pin_salt = salt;
      payload.pin_hash = await hashPin(data.pin, salt);
      payload.pin_bloqueado = false;
    }
    if (data.id) {
      const { error } = await sb.from("colaboradores").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await sb.from("colaboradores").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

/** Baja lógica: el identificador nunca se reutiliza para conservar el histórico. */
export const desactivarColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const sb = await admin();
    const { error } = await sb
      .from("colaboradores")
      .update({ activo: false, deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resolverSolicitudPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resolverPinSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const sb = await admin();
    const { data: sol } = await sb
      .from("colaborador_pin_solicitudes")
      .select("*")
      .eq("id", data.solicitud_id)
      .maybeSingle();
    if (!sol || sol.estado !== "pendiente") throw new Error("Solicitud no disponible");
    if (data.aprobar) {
      await sb
        .from("colaboradores")
        .update({ pin_hash: sol.nuevo_pin_hash, pin_salt: sol.nuevo_pin_salt, pin_bloqueado: false })
        .eq("id", sol.colaborador_id);
    } else {
      await sb.from("colaboradores").update({ pin_bloqueado: false }).eq("id", sol.colaborador_id);
    }
    await sb
      .from("colaborador_pin_solicitudes")
      .update({ estado: data.aprobar ? "aprobada" : "rechazada", resuelto_en: new Date().toISOString() })
      .eq("id", data.solicitud_id);
    return { ok: true };
  });
