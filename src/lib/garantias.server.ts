import type { ColaboradorRol } from "./garantias-shared";

export type Sesion = { cid: string; rol: ColaboradorRol; nombre: string; exp: number };

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function secret(): string {
  // Secreto estable del portal: no depende de llaves que pueden rotar al remixar el proyecto.
  const s = process.env['PORTAL_PIN_SECRET'] ?? process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!s) throw new Error("Falta la configuración del servidor");
  return `garantias:${s}`;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}:${secret()}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signSesion(s: Omit<Sesion, "exp">, horas = 12): Promise<string> {
  const payload = { ...s, exp: Date.now() + horas * 60 * 60 * 1000 };
  const body = btoa(JSON.stringify(payload));
  return `${body}.${await hmac(body)}`;
}

export async function verifySesion(token: string | undefined | null): Promise<Sesion> {
  if (!token || !token.includes(".")) throw new Error("Sesión no válida");
  const [body, sig] = token.split(".");
  if (sig !== (await hmac(body!))) throw new Error("Sesión no válida");
  const payload = JSON.parse(atob(body!)) as Sesion;
  if (!payload.exp || payload.exp < Date.now()) throw new Error("Sesión expirada, vuelve a ingresar tu PIN");
  return payload;
}

export async function requireAdminSesion(token: string | undefined | null): Promise<Sesion> {
  const s = await verifySesion(token);
  if (s.rol !== "admin") throw new Error("Solo un administrador puede realizar esta acción");
  return s;
}

/** El gerente es de solo lectura: no puede editar ni agregar seguimientos. */
export async function requireEscritura(token: string | undefined | null): Promise<Sesion> {
  const s = await verifySesion(token);
  if (s.rol === "gerente") throw new Error("La gerencia tiene acceso de solo lectura");
  return s;
}

/**
 * Token de SOLO LECTURA para imprimir un reporte de garantía sin volver a pedir PIN.
 * Se genera al crear la garantía y al guardar cada seguimiento; vive 30 días.
 */
export async function signReporteToken(garantiaId: string): Promise<string> {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const body = btoa(JSON.stringify({ gid: garantiaId, exp }));
  return `${body}.${await hmac(`reporte:${body}`)}`;
}

export async function verifyReporteToken(token: string, garantiaId: string): Promise<void> {
  if (!token.includes(".")) throw new Error("Enlace de reporte no válido");
  const [body, sig] = token.split(".");
  if (sig !== (await hmac(`reporte:${body!}`))) throw new Error("Enlace de reporte no válido");
  const payload = JSON.parse(atob(body!)) as { gid: string; exp: number };
  if (payload.gid !== garantiaId) throw new Error("Enlace de reporte no válido");
  if (!payload.exp || payload.exp < Date.now()) throw new Error("El enlace del reporte ha expirado");
}

export async function signPedidoToken(numero: string): Promise<string> {
  const exp = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const body = btoa(JSON.stringify({ num: numero, exp }));
  return `${body}.${await hmac(`pedido:${body}`)}`;
}

export async function verifyPedidoToken(token: string | undefined | null, numero: string): Promise<void> {
  if (!token || !token.includes(".")) throw new Error("Enlace de pedido no válido");
  const [body, sig] = token.split(".");
  if (sig !== (await hmac(`pedido:${body!}`))) throw new Error("Enlace de pedido no válido");
  const payload = JSON.parse(atob(body!)) as { num: string; exp: number };
  if (payload.num !== numero) throw new Error("Enlace de pedido no válido");
  if (!payload.exp || payload.exp < Date.now()) throw new Error("El enlace del pedido ha expirado");
}

export async function verificarPinColaborador(colaboradorId: string, pin: string) {
  const sb = await admin();
  const { data, error } = await sb
    .from("colaboradores")
    .select("id,nombre,rol,pin_hash,pin_salt,pin_bloqueado,activo,deleted_at")
    .eq("id", colaboradorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.activo || data.deleted_at) throw new Error("Colaborador no disponible");
  if (data.pin_bloqueado) throw new Error("Tienes una solicitud de PIN pendiente de aprobación");
  if (!data.pin_hash || !data.pin_salt) throw new Error("Aún no tienes un PIN asignado");
  const hash = await hashPin(pin, data.pin_salt);
  if (hash !== data.pin_hash) throw new Error("PIN incorrecto");
  return data as { id: string; nombre: string; rol: ColaboradorRol };
}

/** Ingreso por cédula: se normaliza para tolerar guiones y espacios. */
export async function verificarPinPorCedula(cedula: string, pin: string) {
  const sb = await admin();
  const norm = (v: string) => v.replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
  const { data, error } = await sb
    .from("colaboradores")
    .select("id,nombre,rol,cedula,activo,deleted_at")
    .eq("activo", true)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  const match = (data ?? []).find((c: any) => c.cedula && norm(c.cedula) === norm(cedula));
  if (!match) throw new Error("Cédula o PIN incorrectos");
  try {
    return await verificarPinColaborador(match.id, pin);
  } catch (e: any) {
    if (String(e?.message).includes("PIN incorrecto")) throw new Error("Cédula o PIN incorrectos");
    throw e;
  }
}

export async function firmarUrlEvidencia(path: string): Promise<string> {
  const sb = await admin();
  const { data } = await sb.storage.from("garantia-evidencias").createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

export async function garantiaCompleta(id: string) {
  const sb = await admin();
  const { data: garantia, error } = await sb.from("garantias").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!garantia) throw new Error("Garantía no encontrada");
  const [{ data: seguimientos }, { data: evidencias }, { data: cierre }, { data: colaborador }] = await Promise.all([
    sb.from("garantia_seguimientos").select("*").eq("garantia_id", id).order("fecha", { ascending: true }),
    sb.from("garantia_evidencias").select("*").eq("garantia_id", id).order("subido_en", { ascending: true }),
    sb
      .from("garantia_cierre_solicitud")
      .select("*")
      .eq("garantia_id", id)
      .order("solicitado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from("colaboradores").select("id,nombre,cedula").eq("id", garantia.tramitado_por).maybeSingle(),
  ]);
  const evidenciasFirmadas = await Promise.all(
    (evidencias ?? []).map(async (e: any) => ({ ...e, url: await firmarUrlEvidencia(e.url_imagen) })),
  );
  return {
    garantia,
    seguimientos: seguimientos ?? [],
    evidencias: evidenciasFirmadas,
    cierre: cierre ?? null,
    colaborador: colaborador ?? null,
  };
}

export async function resumenAbiertas(estados: string[]) {
  const sb = await admin();
  const { data: garantias, error } = await sb
    .from("garantias")
    .select("*")
    .in("estado", estados)
    .order("fecha", { ascending: true });
  if (error) throw new Error(error.message);
  const ids = (garantias ?? []).map((g: any) => g.id);
  const { data: segs } = ids.length
    ? await sb.from("garantia_seguimientos").select("*").in("garantia_id", ids).order("fecha", { ascending: true })
    : { data: [] as any[] };
  const { data: colabs } = await sb.from("colaboradores").select("id,nombre,cedula");
  const byId = new Map<string, any>((colabs ?? []).map((c: any) => [c.id as string, c]));
  return (garantias ?? []).map((g: any) => {
    const propios = (segs ?? []).filter((s: any) => s.garantia_id === g.id);
    const ultimo = propios.length ? propios[propios.length - 1].fecha : null;
    return {
      ...g,
      tramitado_por_nombre: byId.get(g.tramitado_por)?.nombre ?? "—",
      seguimientos: propios,
      total_seguimientos: propios.length,
      ultimo_contacto: ultimo,
    };
  });
}

/**
 * Pase de acceso directo a la calculadora de cotizaciones (sin PIN).
 * Es un enlace firmado, no adivinable, ligado a un colaborador y con caducidad.
 */
export async function signPaseCotizacion(colaboradorId: string, dias = 90): Promise<string> {
  const exp = Date.now() + dias * 24 * 60 * 60 * 1000;
  const body = btoa(JSON.stringify({ cid: colaboradorId, exp, n: randomSalt() }));
  return `${body}.${await hmac(`pase:${body}`)}`;
}

export async function verifyPaseCotizacion(token: string | undefined | null): Promise<string> {
  if (!token || !token.includes(".")) throw new Error("Enlace de acceso no válido");
  const [body, sig] = token.split(".");
  if (sig !== (await hmac(`pase:${body!}`))) throw new Error("Enlace de acceso no válido");
  const payload = JSON.parse(atob(body!)) as { cid: string; exp: number };
  if (!payload.exp || payload.exp < Date.now()) throw new Error("El enlace de acceso ha expirado");
  return payload.cid;
}
