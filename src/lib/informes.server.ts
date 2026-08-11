/**
 * Lógica de servidor del Informe mensual: cruces de información, lectura con IA
 * y redacción automática de los textos del informe.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MESES_PERIODO,
  TRIMESTRES,
  bal,
  infoPeriodo,
  mesesDelPeriodoFiscal,
  type DatosRepartven,
  type DatosRepvalor2,
  type InformeDatos,
  type LineaNegocio,
  type RotacionCategoria,
} from "./informes-shared";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Llamada de texto al AI Gateway de Lovable. */
async function chat(messages: any[], opciones: { json?: boolean } = {}) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la clave de IA (LOVABLE_API_KEY)");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      ...(opciones.json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    const detalle = await res.text();
    if (res.status === 429) throw new Error("La lectura con IA está ocupada. Intenta de nuevo en un momento.");
    if (res.status === 402) throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
    throw new Error(`Error de IA [${res.status}]: ${detalle.slice(0, 400)}`);
  }
  const data: any = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

function jsonDe(texto: string) {
  const limpio = texto.replace(/```json|```/g, "").trim();
  const i = limpio.indexOf("{");
  const j = limpio.lastIndexOf("}");
  return JSON.parse(i >= 0 ? limpio.slice(i, j + 1) : limpio);
}

/* --------------------- lectura con IA (respaldo/imágenes) --------------------- */

/** Respaldo con IA cuando el lector automático no reconoce el formato del reporte. */
export async function leerReporteConIA(reporte: string, texto: string) {
  const guia: Record<string, string> = {
    repfacmes:
      'Devuelve {"totales":{"contado_con":n,"credito_con":n,"total_con":n,"contado_sin":n,"credito_sin":n,"total_sin":n,"itbms":n},"por_vendedor":[{"codigo":"17","contado":n,"credito":n}],"por_cajero":[{"codigo":"LBAGOMEZ","total":n,"recibos":n}],"abonos_total":n}. En "por_cajero" agrupa los recibos SOLO por el usuario de caja (usuario del sistema que cobró), NUNCA por el cliente. Los usuarios de caja siempre inician con TOY (Tonosí), CM (Casa Matriz) o LB (Línea Blanca), por ejemplo LBAGOMEZ, CMHDIAZ, TOYGARCIA; incluye también usuarios nuevos con esos prefijos y devuelve el total cobrado y la cantidad de recibos de cada uno. Ignora cualquier código que no tenga esos prefijos.',
    repartven: 'Devuelve {"productos":[{"codigo":"","descripcion":"","cantidad":n,"ventas":n,"costo":n,"ganancia":n}]}',
    repvalor2: 'Devuelve {"clasificaciones":[{"codigo":"","nombre":"","costo":n,"venta":n,"unidades":n}]}',
    repmorosos: 'Devuelve {"total":n,"plazos":{"30 días":n,"60 días":n,"90 días":n,"120 días":n,"364 días":n,"365 días":n},"cuentas":n}',
    repmorosos2:
      'Devuelve {"total":n,"plazos":{"0 días":n,"30 días":n,"60 días":n,"90 días":n,"120 días":n,"más de 120":n},"saldo_actual":n,"cuentas":n}',
    repclientes: 'Devuelve {"clientes":[{"codigo":"","nombre":"","saldo":n}],"total_saldo":n,"cuentas":n}',
    repcompfch: 'Devuelve {"compras":[{"fecha":"","documento":"","proveedor":"","monto":n}],"total":n}',
  };
  const contenido = await chat(
    [
      {
        role: "system",
        content:
          "Eres un asistente contable que extrae valores numéricos exactos de reportes de una mueblería en Panamá. Los montos están en balboas. Responde solo JSON válido, sin comentarios.",
      },
      {
        role: "user",
        content: `Reporte: ${reporte}. ${guia[reporte] ?? "Devuelve un JSON con los totales del reporte."}\n\nContenido del reporte:\n${texto.slice(0, 120000)}`,
      },
    ],
    { json: true },
  );
  return jsonDe(contenido);
}

/** Lectura de una captura de estadísticas de Instagram. */
export async function leerInstagramDesdeImagen(dataUrl: string) {
  const contenido = await chat(
    [
      {
        role: "system",
        content:
          'Lees capturas de estadísticas de Instagram. Responde solo JSON: {"seguidores":n,"cuenta":"linea_blanca|bordados|desconocido","periodo":"YYYY-MM"} usando el número total de seguidores.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extrae el total de seguidores de esta captura." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    { json: true },
  );
  return jsonDe(contenido);
}

/* ------------------------------- cruces de datos ------------------------------- */

const ES_INGRESO_VARIO = (codigo: string, desc: string) =>
  /INGRESO/i.test(codigo) || /INGRESOS POR SUBLIMADOS|INGRESOS VARIOS/i.test(desc);

const ES_BORDADO = (clasificacion: string | undefined, codigo: string, desc: string) =>
  /SUBLIMACI|BORDAD/i.test(clasificacion ?? "") ||
  /BORDAD|SUBLIMAD|POLO|FRANELA|SUETER|SUÉTER|TSHIRT|T-SHIRT|SPANDEX|TOALLA|TAZA|TERMO|GORRA|SOMBRERA|BALDOSA|PLACA/i.test(
    `${codigo} ${desc}`,
  );

/** Ventas por línea de negocio cruzando ventas por producto e inventario. */
export function calcularLineas(ventas: DatosRepartven, inventario?: DatosRepvalor2): LineaNegocio[] {
  const mapa = inventario?.clasificacion_por_codigo ?? {};
  const acum: Record<string, LineaNegocio> = {
    "Línea Blanca": { linea: "Línea Blanca", ventas: 0, unidades: 0, ganancia: 0 },
    Bordados: { linea: "Bordados", ventas: 0, unidades: 0, ganancia: 0 },
    "Ingresos varios": { linea: "Ingresos varios", ventas: 0, unidades: 0, ganancia: 0 },
  };
  for (const p of ventas.productos) {
    const clasif = mapa[p.codigo.toUpperCase()];
    const key = ES_INGRESO_VARIO(p.codigo, p.descripcion)
      ? "Ingresos varios"
      : ES_BORDADO(clasif, p.codigo, p.descripcion)
        ? "Bordados"
        : "Línea Blanca";
    const e = acum[key]!;
    e.ventas += p.ventas;
    e.unidades += p.cantidad;
    e.ganancia += p.ganancia;
  }
  return Object.values(acum).map((l) => ({
    ...l,
    ventas: Math.round(l.ventas * 100) / 100,
    ganancia: Math.round(l.ganancia * 100) / 100,
  }));
}

/**
 * Rotación: cruza el reporte REPARTVEN con el catálogo para asignar a cada
 * modelo vendido su categoría real (el reporte interno solo distingue
 * mueblería y bordados). Devuelve las categorías con más unidades vendidas y
 * sus modelos más vendidos del mes.
 */
export async function calcularRotacion(
  ventas: DatosRepartven,
  inventario?: DatosRepvalor2,
): Promise<RotacionCategoria[]> {
  const { data: productos } = await supabaseAdmin
    .from("products")
    .select("code, model, name, categories(name)");

  const norm = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const categoriaPorCodigo = new Map<string, string>();
  const categoriaPorNombre: { nombre: string; categoria: string }[] = [];
  for (const p of (productos ?? []) as any[]) {
    const cat = p.categories?.name as string | undefined;
    if (!cat) continue;
    for (const c of [p.code, p.model].filter(Boolean)) {
      const k = norm(String(c));
      if (k.length >= 3) categoriaPorCodigo.set(k, cat);
    }
    if (p.name) categoriaPorNombre.push({ nombre: String(p.name).toUpperCase(), categoria: cat });
  }

  /** Palabras clave de respaldo cuando el modelo no está en el catálogo. */
  const CLAVES: [RegExp, string][] = [
    [/LAVADOR/, "Lavadoras"],
    [/SECADOR/, "Secadoras"],
    [/REFRIGERADOR|NEVERA|FREEZER|CONGELADOR/, "Refrigeración"],
    [/ESTUFA|COCINA|HORNO|MICROOND/, "Cocinas y hornos"],
    [/AIRE|SPLIT|ABANICO|VENTILADOR/, "Climatización"],
    [/TELEVIS|SMART\s?TV|\bTV\b|PANTALLA/, "Televisores"],
    [/JUEGO DE (SALA|CUARTO|COMEDOR)|SOFA|SOFÁ|CAMA|COLCHON|COLCHÓN|MUEBLE|MESA|SILLA|GABINETE|ARMARIO/, "Muebles"],
    [/LICUADOR|BATIDOR|OLLA|FREIDOR|SANDWICH|CAFETER|PLANCHA|ASPIRADOR/, "Electrodomésticos menores"],
  ];

  const categoriaDe = (codigo: string, descripcion: string) => {
    const cod = norm(codigo);
    const directa = categoriaPorCodigo.get(cod);
    if (directa) return directa;
    const desc = descripcion.toUpperCase();
    const porNombre = categoriaPorNombre.find((n) => n.nombre.length > 5 && desc.includes(n.nombre));
    if (porNombre) return porNombre.categoria;
    const clasifCod = (inventario?.clasificacion_por_codigo ?? {})[codigo.toUpperCase()];
    if (ES_INGRESO_VARIO(codigo, descripcion)) return "Ingresos varios";
    if (ES_BORDADO(clasifCod, codigo, descripcion)) return "Sublimación y bordado";
    for (const [re, cat] of CLAVES) if (re.test(desc)) return cat;
    return "Otros artículos";
  };

  const acum = new Map<string, RotacionCategoria>();
  for (const p of ventas.productos) {
    const categoria = categoriaDe(p.codigo, p.descripcion);
    const e = acum.get(categoria) ?? { categoria, ventas: 0, unidades: 0, modelos: [] as RotacionCategoria["modelos"] };
    e.ventas += p.ventas;
    e.unidades += p.cantidad;
    const previo = e.modelos.find((m) => norm(m.codigo) === norm(p.codigo));
    if (previo) {
      previo.unidades += p.cantidad;
      previo.ventas += p.ventas;
    } else {
      e.modelos.push({ codigo: p.codigo, descripcion: p.descripcion, unidades: p.cantidad, ventas: p.ventas });
    }
    acum.set(categoria, e);
  }

  return [...acum.values()]
    .sort((a, b) => b.unidades - a.unidades || b.ventas - a.ventas)
    .slice(0, 10)
    .map((c) => ({
      ...c,
      ventas: Math.round(c.ventas * 100) / 100,
      modelos: c.modelos
        .sort((a, b) => b.unidades - a.unidades || b.ventas - a.ventas)
        .slice(0, 5)
        .map((m) => ({ ...m, ventas: Math.round(m.ventas * 100) / 100 })),
    }));
}

/** Conversión de cotizaciones del sitio en ventas facturadas del mes. */
export async function calcularConversion(periodo: string, datos: InformeDatos) {
  const { anio, mes } = infoPeriodo(periodo);
  const desde = `${periodo}-01T00:00:00Z`;
  const hasta = new Date(Date.UTC(anio, mes, 1)).toISOString();

  const { data: solicitudes } = await supabaseAdmin
    .from("cotizacion_solicitudes")
    .select("numero, cliente, created_at")
    .gte("created_at", desde)
    .lt("created_at", hasta);

  const ventas = datos.repfacmes?.ventas ?? [];
  const normal = (s: string) =>
    s
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const detalle: NonNullable<InformeDatos["conversion"]>["detalle"] = [];
  for (const s of (solicitudes ?? []) as any[]) {
    const nombre = String(s.cliente?.nombre ?? s.cliente?.name ?? "").trim();
    if (!nombre) continue;
    const claves = normal(nombre).split(" ").filter((w) => w.length > 3);
    const venta = ventas.find((v) => {
      const c = normal(v.cliente);
      return claves.length > 0 && claves.every((k) => c.includes(k));
    });
    detalle.push({
      cliente: nombre,
      cotizacion: s.numero,
      ...(venta ? { factura: venta.factura, monto: venta.total } : {}),
    });
  }
  const convertidas = detalle.filter((d) => d.factura).length;
  return {
    cotizaciones: detalle.length,
    convertidas,
    tasa: detalle.length ? Math.round((convertidas / detalle.length) * 1000) / 1000 : 0,
    detalle,
  };
}

/** Cuentas por cobrar: saldo anterior + ventas a crédito − abonos. */
export async function calcularCxc(periodo: string, datos: InformeDatos) {
  const { anio, mes } = infoPeriodo(periodo);
  const anteriorMes = mes === 1 ? 12 : mes - 1;
  const anteriorAnio = mes === 1 ? anio - 1 : anio;
  const anterior = `${anteriorAnio}-${String(anteriorMes).padStart(2, "0")}`;
  const { data: prev } = await supabaseAdmin
    .from("informes_mensuales")
    .select("datos")
    .eq("periodo", anterior)
    .maybeSingle();

  const saldoPrev = (prev?.datos as any)?.repclientes?.total_saldo ?? 0;
  const ventas_credito = datos.repfacmes?.totales.credito_con ?? 0;
  const abonos = datos.repfacmes?.abonos_total ?? 0;
  const saldo_actual = datos.repclientes?.total_saldo ?? 0;
  const vencida = datos.morosidad?.vencida.total ?? 0;
  const no_vencida = datos.morosidad?.no_vencida.total ?? 0;
  const saldoCalculado = Math.round((saldoPrev + ventas_credito - abonos) * 100) / 100;
  const base = saldo_actual || saldoCalculado;

  return {
    saldo_mes_anterior: saldoPrev || Math.round((base - ventas_credito + abonos) * 100) / 100,
    ventas_credito,
    abonos,
    saldo_mes_actual: base,
    cxc_corriente: Math.round((base - vencida - no_vencida) * 100) / 100,
    morosidad_total: Math.round((vencida + no_vencida) * 100) / 100,
  };
}

/* ------------------------------ gestión operativa ------------------------------ */

/** Acciones del mes de cada colaborador en el portal, resumidas por IA. */
export async function generarGestion(periodo: string) {
  const { anio, mes, mesNombre } = infoPeriodo(periodo);
  const desde = `${periodo}-01`;
  const hasta = new Date(Date.UTC(anio, mes, 1)).toISOString().slice(0, 10);

  const { data: colaboradores } = await supabaseAdmin
    .from("colaboradores")
    .select("id, nombre, rol")
    .is("deleted_at", null);

  const { data: tareas } = await supabaseAdmin
    .from("tareas")
    .select("id, titulo, descripcion, tipo, estado, asignado_a, apoyo_a, completada_por, nota_cierre, fecha")
    .gte("fecha", desde)
    .lt("fecha", hasta);

  const { data: seguimientos } = await supabaseAdmin
    .from("tarea_seguimientos")
    .select("tarea_id, via, texto, creado_por, fecha")
    .gte("fecha", desde)
    .lt("fecha", hasta);

  const resultado: { nombre: string; texto_ia: string; texto_manual: string }[] = [];

  for (const c of (colaboradores ?? []) as any[]) {
    const suyas = (tareas ?? []).filter(
      (t: any) => t.asignado_a === c.id || t.apoyo_a === c.id || t.completada_por === c.id,
    );
    const segs = (seguimientos ?? []).filter((s: any) => s.creado_por === c.id);
    if (suyas.length === 0 && segs.length === 0) {
      resultado.push({
        nombre: c.nombre,
        texto_ia: `${c.nombre} no registró actividad en el portal durante ${mesNombre.toLowerCase()} de ${anio}.`,
        texto_manual: "",
      });
      continue;
    }
    const bitacora = [
      ...suyas.map(
        (t: any) =>
          `[${t.fecha}] ${t.tipo} · ${t.estado} · ${t.titulo}${t.descripcion ? ` — ${t.descripcion}` : ""}${
            t.nota_cierre ? ` (cierre: ${t.nota_cierre})` : ""
          }`,
      ),
      ...segs.map((s: any) => `[${s.fecha}] seguimiento por ${s.via}: ${s.texto}`),
    ]
      .join("\n")
      .slice(0, 20000);

    const texto = await chat([
      {
        role: "system",
        content:
          "Redactas el informe de gestión operativa mensual de una mueblería cooperativa en Panamá. Escribe en español formal, en tercera persona, 1 o 2 párrafos, sin listas ni encabezados. Describe funciones cumplidas, volumen de actividad, incidencias y una recomendación. No inventes datos que no estén en la bitácora.",
      },
      {
        role: "user",
        content: `Colaborador: ${c.nombre} (${c.rol}). Período: ${mesNombre} ${anio}.\nTareas registradas: ${suyas.length}. Seguimientos: ${segs.length}.\nBitácora:\n${bitacora}`,
      },
    ]);
    resultado.push({ nombre: c.nombre, texto_ia: texto.trim(), texto_manual: "" });
  }

  const general = await chat([
    {
      role: "system",
      content:
        "Redactas el párrafo introductorio del informe de gestión operativa mensual de la sección Línea Blanca y Bordados de una cooperativa panameña. Español formal, un párrafo.",
    },
    {
      role: "user",
      content: `Período ${mesNombre} ${anio}. Tareas del mes: ${(tareas ?? []).length}. Seguimientos: ${(seguimientos ?? []).length}. Colaboradores activos: ${(colaboradores ?? []).length}.`,
    },
  ]);

  return { colaboradores: resultado, general: general.trim() };
}

/* --------------------------------- narrativa --------------------------------- */

/** Textos automáticos del informe (ventas del período y recuperación de CxC). */
export async function generarNarrativa(periodo: string, datos: InformeDatos, serieVentas: Record<string, any>, serieCobros: Record<string, any>) {
  const { mesNombre, anio, periodoFiscal, inicioFiscal } = infoPeriodo(periodo);
  const meses = mesesDelPeriodoFiscal(inicioFiscal);
  const acumContado = meses.reduce((s, m) => s + (serieVentas[m.periodo]?.contado ?? 0), 0);
  const acumCredito = meses.reduce((s, m) => s + (serieVentas[m.periodo]?.credito ?? 0), 0);
  const acumTotal = Math.round((acumContado + acumCredito) * 100) / 100;
  const acumCobros = meses.reduce((s, m) => s + (serieCobros[m.periodo]?.total ?? 0), 0);
  const cxc = datos.cxc;

  const ventas = `Las ventas totales del período ${periodoFiscal} ascienden a ${bal(acumTotal)} con ITBMS incluido (${bal(
    acumTotal / 1.07,
  )} antes del 7% de ITBMS), desglosados de la siguiente forma: contado ${bal(acumContado)} y crédito ${bal(
    acumCredito,
  )}. En el mes de ${mesNombre} de ${anio} se registraron ventas por ${bal(
    datos.repfacmes?.totales.total_con,
  )} (${bal(datos.repfacmes?.totales.total_sin)} antes del ITBMS), de las cuales ${bal(
    datos.repfacmes?.totales.contado_con,
  )} corresponden a ventas al contado y ${bal(datos.repfacmes?.totales.credito_con)} a ventas al crédito.`;

  const recuperacion = `Durante el período ${periodoFiscal}, los cobros totales alcanzan la suma de ${bal(
    Math.round(acumCobros * 100) / 100,
  )}. En cuanto a la gestión de cartera, la morosidad total del mes asciende a ${bal(
    cxc?.morosidad_total,
  )} —${bal(datos.morosidad?.vencida.total)} vencida y ${bal(
    datos.morosidad?.no_vencida.total,
  )} no vencida— mientras que las cuentas que se mantienen al corriente representan un monto de ${bal(
    cxc?.cxc_corriente,
  )}.`;

  const lineas = (datos.lineas ?? [])
    .map((l) => `${l.linea}: ${bal(l.ventas)} (${l.unidades} unidades)`)
    .join("; ");

  const compras = datos.compras
    ? `Las compras registradas en el mes totalizan ${bal(datos.compras.total)} en ${datos.compras.compras.length} documentos, equivalentes al ${(
        (datos.compras.total / Math.max(datos.repfacmes?.totales.total_sin ?? 1, 1)) *
        100
      ).toFixed(1)}% de las ventas antes de ITBMS.`
    : "";

  const alertas = datos.repclientes?.alertas?.length
    ? `Se detectaron ${datos.repclientes.alertas.length} situaciones que requieren revisión de contabilidad (saldos irregulares o cuentas duplicadas).`
    : "No se detectaron saldos irregulares ni cuentas duplicadas en el reporte general de clientes.";

  return { ventas, recuperacion, lineas: lineas ? `Ventas por línea de negocio — ${lineas}.` : "", compras, alertas };
}

/* -------------------------- consolidados trimestral/anual -------------------------- */

/** Consolida los informes de un período fiscal en un resumen trimestral o anual. */
export async function consolidado(inicioFiscal: number, tipo: "trimestral" | "anual", trimestre = 1) {
  const meses = mesesDelPeriodoFiscal(inicioFiscal);
  const seleccion =
    tipo === "anual"
      ? meses
      : meses.filter((m) => (TRIMESTRES[trimestre - 1]?.meses ?? []).includes(m.nombre));

  const { data } = await supabaseAdmin
    .from("informes_mensuales")
    .select("periodo, datos")
    .in("periodo", seleccion.map((m) => m.periodo));

  const filas = (data ?? []).map((r: any) => {
    const d = r.datos as InformeDatos;
    return {
      periodo: r.periodo,
      mes: MESES_PERIODO.find((n) => n === infoPeriodo(r.periodo).mesNombre) ?? infoPeriodo(r.periodo).mesNombre,
      contado: d.repfacmes?.totales.contado_con ?? 0,
      credito: d.repfacmes?.totales.credito_con ?? 0,
      total: d.repfacmes?.totales.total_con ?? 0,
      abonos: d.repfacmes?.abonos_total ?? 0,
      morosidad: d.cxc?.morosidad_total ?? 0,
      compras: d.compras?.total ?? 0,
      lineas: d.lineas ?? [],
    };
  });

  const sum = (k: "contado" | "credito" | "total" | "abonos" | "compras") =>
    Math.round(filas.reduce((s, f) => s + (f[k] as number), 0) * 100) / 100;

  const lineas: Record<string, number> = {};
  for (const f of filas) for (const l of f.lineas) lineas[l.linea] = Math.round(((lineas[l.linea] ?? 0) + l.ventas) * 100) / 100;

  return {
    tipo,
    trimestre,
    periodoFiscal: `${inicioFiscal}-${inicioFiscal + 1}`,
    meses: filas,
    totales: {
      contado: sum("contado"),
      credito: sum("credito"),
      total: sum("total"),
      abonos: sum("abonos"),
      compras: sum("compras"),
      morosidad_ultimo: filas.at(-1)?.morosidad ?? 0,
    },
    lineas,
  };
}

/* ------------------------ explicaciones de cada tabla ------------------------ */

/**
 * Redacta con IA una explicación breve para cada sección/tabla del informe.
 * Solo se generan las secciones que tienen datos; la administración puede
 * editarlas luego desde el dashboard.
 */
export async function generarExplicacionesTablas(periodo: string, datos: InformeDatos) {
  const { SECCIONES_INFORME } = await import("./informes-shared");
  const { mesNombre, anio, periodoFiscal } = infoPeriodo(periodo);

  const resumen: Record<string, unknown> = {
    ventas: datos.repfacmes?.totales,
    vendedores: datos.repfacmes?.por_vendedor,
    lineas: datos.lineas,
    rotacion: (datos.rotacion ?? []).map((c) => ({
      categoria: c.categoria,
      unidades: c.unidades,
      ventas: c.ventas,
      top: c.modelos.slice(0, 3),
    })),
    cxc: datos.cxc,
    morosidad: datos.morosidad,
    abonos: datos.repfacmes?.abonos_total,
    compras: datos.compras ? { total: datos.compras.total, documentos: datos.compras.compras.length } : null,
    alertas: datos.repclientes?.alertas?.slice(0, 10),
    conversion: datos.conversion
      ? { cotizaciones: datos.conversion.cotizaciones, convertidas: datos.conversion.convertidas, tasa: datos.conversion.tasa }
      : null,
  };

  const claves = SECCIONES_INFORME.map((s) => s.id).join(", ");
  const contenido = await chat(
    [
      {
        role: "system",
        content:
          "Eres analista financiero de una cooperativa panameña. Redactas explicaciones ejecutivas en español, en tono formal, claras y breves (2 a 3 oraciones, máximo 60 palabras). No inventes cifras: usa solo los datos entregados. Responde únicamente JSON.",
      },
      {
        role: "user",
        content:
          `Informe de ${mesNombre} ${anio} (período fiscal ${periodoFiscal}). Redacta una explicación para cada sección con datos.\n` +
          `Devuelve un objeto JSON cuyas claves sean exactamente algunas de: ${claves}. Omite las secciones sin datos.\n` +
          `Datos: ${JSON.stringify(resumen).slice(0, 60_000)}`,
      },
    ],
    { json: true },
  );

  const bruto = jsonDe(contenido) as Record<string, unknown>;
  const validas = new Set<string>(SECCIONES_INFORME.map((s) => s.id));
  const salida: Record<string, string> = {};
  for (const [k, v] of Object.entries(bruto)) {
    if (validas.has(k) && typeof v === "string" && v.trim()) salida[k] = v.trim().slice(0, 1200);
  }
  return salida;
}
