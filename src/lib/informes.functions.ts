import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifySesion } from "./garantias.server";
import { parsePorReporte } from "./informes-parsers";
import { REPORTES, SERIES } from "./informes-shared";

const tokenSchema = z.object({ token: z.string().min(1) });
const periodoRe = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Lectura: administración y gerencia. Escritura: solo administración. */
async function lectura(token: string) {
  const s = await verifySesion(token);
  if (s.rol !== "admin" && s.rol !== "gerente")
    throw new Error("Este módulo está disponible para la administración y la gerencia");
  return s;
}
async function escritura(token: string) {
  const s = await verifySesion(token);
  if (s.rol !== "admin") throw new Error("Solo la administración puede modificar el informe mensual");
  return s;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function informeDe(periodo: string) {
  const db = await admin();
  const { data } = await db.from("informes_mensuales").select("*").eq("periodo", periodo).maybeSingle();
  if (data) return data;
  const { data: nuevo, error } = await db
    .from("informes_mensuales")
    .insert({ periodo })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return nuevo;
}

/* --------------------------------- lectura --------------------------------- */

/** Informe del período con sus series históricas y archivos cargados. */
export const obtenerInforme = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.extend({ periodo: z.string().regex(periodoRe) }).parse(d))
  .handler(async ({ data }) => {
    const s = await lectura(data.token);
    const db = await admin();
    const informe =
      s.rol === "admin"
        ? await informeDe(data.periodo)
        : (await db.from("informes_mensuales").select("*").eq("periodo", data.periodo).maybeSingle()).data;

    const [{ data: series }, { data: archivos }, { data: periodos }] = await Promise.all([
      db.from("informe_series").select("serie, periodo, datos"),
      db.from("informe_archivos").select("id, reporte, filename, resumen, created_at").eq("periodo", data.periodo).order("created_at", { ascending: false }),
      db.from("informes_mensuales").select("periodo, estado, generado_en").order("periodo", { ascending: false }),
    ]);

    return {
      rol: s.rol,
      informe,
      series: series ?? [],
      archivos: archivos ?? [],
      periodos: periodos ?? [],
    };
  });

/* ----------------------------- carga de reportes ----------------------------- */

/**
 * Reconoce los valores de un reporte interno. Primero usa el lector
 * determinista; si no reconoce nada, recurre a la lectura con IA.
 */
export const cargarReporte = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        periodo: z.string().regex(periodoRe),
        reporte: z.enum(REPORTES.map((r) => r.id) as [string, ...string[]]),
        filename: z.string().max(200).optional(),
        texto: z.string().min(20).max(2_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();

    let datos: any;
    let resumen: Record<string, any>;
    let via = "lector automático";
    try {
      const r = parsePorReporte(data.reporte, data.texto);
      datos = r.datos;
      resumen = r.resumen;
      const vacio = Object.values(resumen).every((v) => !v);
      if (vacio) throw new Error("sin coincidencias");
    } catch {
      const { leerReporteConIA } = await import("./informes.server");
      datos = await leerReporteConIA(data.reporte, data.texto);
      resumen = { lectura: "IA", ...(datos?.totales ?? {}), total: datos?.total ?? datos?.total_saldo };
      via = "lectura con IA";
    }

    const informe = await informeDe(data.periodo);
    const actuales = (informe.datos ?? {}) as Record<string, any>;
    const siguiente: Record<string, any> = { ...actuales };

    if (data.reporte === "repmorosos" || data.reporte === "repmorosos2") {
      const m = (actuales.morosidad ?? {}) as any;
      siguiente.morosidad = {
        vencida: data.reporte === "repmorosos" ? { total: datos.total, plazos: datos.plazos } : m.vencida ?? { total: 0, plazos: {} },
        no_vencida:
          data.reporte === "repmorosos2"
            ? { total: datos.total, plazos: datos.plazos, saldo_actual: datos.saldo_actual, cuentas: datos.cuentas }
            : m.no_vencida ?? { total: 0, plazos: {}, saldo_actual: 0, cuentas: 0 },
      };
      siguiente[data.reporte] = datos;
    } else if (data.reporte === "repcompfch") {
      siguiente.compras = datos;
    } else {
      siguiente[data.reporte] = datos;
    }

    await db.from("informes_mensuales").update({ datos: siguiente, estado: "borrador" }).eq("periodo", data.periodo);
    await db.from("informe_archivos").insert({
      periodo: data.periodo,
      reporte: data.reporte,
      filename: data.filename ?? null,
      resumen: { ...resumen, via },
    });

    return { resumen, via };
  });

/** Guardado manual de una sección de datos (correcciones de la administradora). */
export const guardarDatos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        periodo: z.string().regex(periodoRe),
        clave: z.string().min(2).max(40),
        valor: z.any(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();
    const informe = await informeDe(data.periodo);
    const datos = { ...(informe.datos ?? {}), [data.clave]: data.valor };
    const { error } = await db.from("informes_mensuales").update({ datos }).eq("periodo", data.periodo);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ series históricas ------------------------------ */

/** Guarda un punto de una serie histórica (ventas, cobros, clientes, Instagram). */
export const guardarSerie = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        serie: z.enum(SERIES.map((s) => s.id) as [string, ...string[]]),
        periodo: z.string().regex(periodoRe),
        datos: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();
    const { error } = await db
      .from("informe_series")
      .upsert({ serie: data.serie, periodo: data.periodo, datos: data.datos }, { onConflict: "serie,periodo" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lectura con IA de una captura de estadísticas de Instagram. */
export const leerInstagram = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.extend({ imagen: z.string().min(100).max(12_000_000) }).parse(d))
  .handler(async ({ data }) => {
    await escritura(data.token);
    const { leerInstagramDesdeImagen } = await import("./informes.server");
    return leerInstagramDesdeImagen(data.imagen);
  });

/* -------------------------------- generación -------------------------------- */

/**
 * Calcula los cruces (líneas de negocio, rotación, CxC, conversión), redacta
 * los textos y guarda el informe como generado.
 */
export const generarInforme = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.extend({ periodo: z.string().regex(periodoRe) }).parse(d))
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();
    const srv = await import("./informes.server");
    const informe = await informeDe(data.periodo);
    const datos = { ...((informe.datos ?? {}) as any) };

    if (!datos.repfacmes) throw new Error("Carga primero el reporte REPFACMES del mes.");

    if (datos.repartven) {
      datos.lineas = srv.calcularLineas(datos.repartven, datos.repvalor2);
      datos.rotacion = await srv.calcularRotacion(datos.repartven, datos.repvalor2);
    }
    datos.cxc = await srv.calcularCxc(data.periodo, datos);
    datos.conversion = await srv.calcularConversion(data.periodo, datos);

    // La serie de ventas y cobros del mes se actualiza con lo facturado.
    await db.from("informe_series").upsert(
      [
        {
          serie: "ventas_historicas",
          periodo: data.periodo,
          datos: {
            contado: datos.repfacmes.totales.contado_con,
            credito: datos.repfacmes.totales.credito_con,
            total: datos.repfacmes.totales.total_con,
          },
        },
        {
          serie: "cobros_historicos",
          periodo: data.periodo,
          datos: { total: datos.repfacmes.abonos_total },
        },
      ],
      { onConflict: "serie,periodo" },
    );

    const { data: series } = await db.from("informe_series").select("serie, periodo, datos");
    const mapa = (serie: string) =>
      Object.fromEntries((series ?? []).filter((s: any) => s.serie === serie).map((s: any) => [s.periodo, s.datos]));

    const narrativa = await srv.generarNarrativa(
      data.periodo,
      datos,
      mapa("ventas_historicas"),
      mapa("cobros_historicos"),
    );

    const gestionPrevia = (informe.gestion ?? {}) as any;
    const gestion = gestionPrevia?.colaboradores?.length ? gestionPrevia : await srv.generarGestion(data.periodo);

    const { error } = await db
      .from("informes_mensuales")
      .update({
        datos,
        narrativa: { ...(informe.narrativa ?? {}), ...narrativa },
        gestion,
        estado: "generado",
        generado_en: new Date().toISOString(),
      })
      .eq("periodo", data.periodo);
    if (error) throw new Error(error.message);
    return { ok: true, datos, narrativa, gestion };
  });

/** Vuelve a generar el informe de gestión operativa con las acciones del portal. */
export const regenerarGestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.extend({ periodo: z.string().regex(periodoRe) }).parse(d))
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();
    const { generarGestion } = await import("./informes.server");
    const informe = await informeDe(data.periodo);
    const nueva = await generarGestion(data.periodo);
    const previos = ((informe.gestion ?? {}) as any).colaboradores ?? [];
    // Se conservan los aportes manuales de cada colaborador.
    const colaboradores = nueva.colaboradores.map((c) => ({
      ...c,
      texto_manual: previos.find((p: any) => p.nombre === c.nombre)?.texto_manual ?? "",
    }));
    const gestion = { general: nueva.general, colaboradores };
    await db.from("informes_mensuales").update({ gestion }).eq("periodo", data.periodo);
    return gestion;
  });

/** Edición manual de textos del informe (narrativa y gestión). */
export const guardarTextos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        periodo: z.string().regex(periodoRe),
        narrativa: z.record(z.string(), z.string()).optional(),
        gestion: z
          .object({
            general: z.string().max(20000),
            colaboradores: z.array(
              z.object({
                nombre: z.string().max(200),
                texto_ia: z.string().max(20000),
                texto_manual: z.string().max(20000),
              }),
            ),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await escritura(data.token);
    const db = await admin();
    const informe = await informeDe(data.periodo);
    const update: Record<string, any> = {};
    if (data.narrativa) update.narrativa = { ...(informe.narrativa ?? {}), ...data.narrativa };
    if (data.gestion) update.gestion = data.gestion;
    const { error } = await db.from("informes_mensuales").update(update).eq("periodo", data.periodo);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Resumen consolidado trimestral o anual del período fiscal. */
export const obtenerConsolidado = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    tokenSchema
      .extend({
        inicioFiscal: z.number().int().min(2020).max(2100),
        tipo: z.enum(["trimestral", "anual"]),
        trimestre: z.number().int().min(1).max(4).default(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await lectura(data.token);
    const { consolidado } = await import("./informes.server");
    return consolidado(data.inicioFiscal, data.tipo, data.trimestre);
  });
