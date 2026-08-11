/**
 * Seguimiento de alertas de contabilidad e histórico mensual del informe.
 * Solo se usa desde funciones de servidor (acceso privilegiado).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { InformeDatos } from "./informes-shared";

/** Período anterior en formato YYYY-MM. */
export function periodoAnterior(periodo: string) {
  const [a, m] = periodo.split("-").map(Number);
  const anio = a ?? 0;
  const mes = m ?? 1;
  return mes === 1 ? `${anio - 1}-12` : `${anio}-${String(mes - 1).padStart(2, "0")}`;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

/** Clave estable de una alerta para poder rastrearla entre períodos. */
export function claveAlerta(a: { tipo: string; cliente: string; detalle?: string }) {
  return `${norm(a.tipo)}|${norm(a.cliente)}`;
}

export type AlertaGuardada = {
  id: string;
  periodo: string;
  clave: string;
  tipo: string;
  cliente: string | null;
  detalle: string | null;
  monto: number;
  estado: "abierta" | "corregida" | "descartada";
  primer_periodo: string;
  meses_arrastre: number;
  nota: string | null;
  resuelto_en: string | null;
};

/**
 * Sincroniza las alertas detectadas en el período con el histórico:
 * detecta arrastres (la misma cuenta con error que ya venía de meses
 * anteriores) y marca como corregidas las que ya no aparecen.
 */
export async function sincronizarAlertas(periodo: string, datos: InformeDatos) {
  const db = supabaseAdmin as any;
  const detectadas = datos.repclientes?.alertas ?? [];
  if (!datos.repclientes) return { sincronizadas: 0, arrastres: 0 };

  // Historial previo de cada clave (períodos anteriores al actual).
  const { data: previas } = await db
    .from("informe_alertas")
    .select("clave, periodo, primer_periodo, estado")
    .lt("periodo", periodo);

  const historial = new Map<string, { periodos: string[]; primer: string }>();
  for (const p of (previas ?? []) as any[]) {
    const h = historial.get(p.clave) ?? { periodos: [], primer: p.periodo };
    h.periodos.push(p.periodo);
    if (p.primer_periodo < h.primer) h.primer = p.primer_periodo;
    if (p.periodo < h.primer) h.primer = p.periodo;
    historial.set(p.clave, h);
  }

  const filas = detectadas.map((a) => {
    const clave = claveAlerta({ tipo: a.tipo, cliente: a.cliente, detalle: a.detalle });
    const h = historial.get(clave);
    return {
      periodo,
      clave,
      tipo: a.tipo,
      cliente: a.cliente,
      detalle: a.detalle,
      monto: Number(a.monto ?? 0),
      primer_periodo: h?.primer ?? periodo,
      meses_arrastre: h ? new Set(h.periodos).size : 0,
    };
  });

  if (filas.length) {
    await db.from("informe_alertas").upsert(filas, { onConflict: "periodo,clave", ignoreDuplicates: false });
  }

  // Las alertas del mes anterior que ya no aparecen se consideran corregidas.
  const anterior = periodoAnterior(periodo);
  const vigentes = new Set(filas.map((f) => f.clave));
  const { data: abiertasAnteriores } = await db
    .from("informe_alertas")
    .select("id, clave")
    .eq("periodo", anterior)
    .eq("estado", "abierta");
  const corregidas = (abiertasAnteriores ?? []).filter((a: any) => !vigentes.has(a.clave)).map((a: any) => a.id);
  if (corregidas.length) {
    await db
      .from("informe_alertas")
      .update({ estado: "corregida", resuelto_en: new Date().toISOString() })
      .in("id", corregidas);
  }

  return { sincronizadas: filas.length, arrastres: filas.filter((f) => f.meses_arrastre > 0).length };
}

/** Guarda la fotografía histórica de las cifras del mes (solo administración). */
export async function guardarHistorico(periodo: string, datos: InformeDatos) {
  const db = supabaseAdmin as any;
  const f = datos.repfacmes;
  const { data: series } = await db.from("informe_series").select("serie, datos").eq("periodo", periodo);
  const serie = (id: string) => (series ?? []).find((s: any) => s.serie === id)?.datos ?? {};
  const { data: alertas } = await db.from("informe_alertas").select("estado, meses_arrastre").eq("periodo", periodo);

  const metricas = {
    ventas: {
      contado: f?.totales.contado_con ?? 0,
      credito: f?.totales.credito_con ?? 0,
      total: f?.totales.total_con ?? 0,
      itbms: f?.totales.itbms ?? 0,
    },
    recibos: {
      total: f?.abonos_total ?? 0,
      cantidad: (f?.por_cajero ?? []).reduce((s, c) => s + (c.recibos ?? 0), 0),
      por_cajero: f?.por_cajero ?? [],
    },
    morosidad: {
      vencida: datos.morosidad?.vencida.total ?? 0,
      no_vencida: datos.morosidad?.no_vencida.total ?? 0,
      saldo_cartera: datos.cxc?.saldo_mes_actual ?? 0,
    },
    clientes_nuevos: Number((serie("clientes_nuevos") as any)?.total ?? 0),
    instagram: Number((serie("instagram") as any)?.seguidores ?? (serie("instagram") as any)?.total ?? 0),
    alertas: {
      total: (alertas ?? []).length,
      abiertas: (alertas ?? []).filter((a: any) => a.estado === "abierta").length,
      arrastre: (alertas ?? []).filter((a: any) => a.meses_arrastre > 0).length,
    },
  };

  await db.from("informe_historicos").upsert({ periodo, metricas }, { onConflict: "periodo" });
  return metricas;
}
