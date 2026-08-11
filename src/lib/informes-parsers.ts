/**
 * Lectores deterministas de los reportes internos del sistema de facturación.
 * Reciben el texto plano del reporte (extraído del PDF, Excel o texto pegado)
 * y devuelven los valores ya reconocidos. La IA solo se usa como respaldo
 * cuando el formato no coincide (ver informes.server.ts).
 */
import {
  CAJEROS,
  RE_CODIGO_CAJERO,
  VENDEDORES,
  VENDEDOR_POR_DEFECTO,
  esCodigoCajero,
  nombreCajero,
  type AbonoFila,
  type AlertaCliente,
  type DatosCompras,
  type DatosMorosidad,
  type DatosRepartven,
  type DatosRepclientes,
  type DatosRepfacmes,
  type DatosRepvalor2,
  type ProductoVenta,
  type VentaFila,
} from "./informes-shared";

/** "1,234.56" -> 1234.56 · "1.234,56" -> 1234.56 */
export function num(raw: string | undefined | null): number {
  if (!raw) return 0;
  let s = raw.trim().replace(/\s/g, "");
  const neg = /^\(.*\)$/.test(s) || s.startsWith("-");
  s = s.replace(/[()\-]/g, "");
  const coma = s.lastIndexOf(",");
  const punto = s.lastIndexOf(".");
  if (coma > punto) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const v = Number.parseFloat(s);
  if (!Number.isFinite(v)) return 0;
  return neg ? -v : v;
}

const lineas = (texto: string) => texto.split(/\r?\n/);

/**
 * El usuario de caja es el único token con prefijo de sucursal (TOY/CM/LB).
 * Se busca en toda la fila para no confundirlo con el código del cliente y
 * los cajeros nuevos se aceptan igual, rotulados por su sucursal.
 */
export function detectarCajero(linea: string): string | null {
  const tokens = linea.toUpperCase().match(/[A-ZÑ]{4,22}/g) ?? [];
  const candidatos = tokens.filter((t) => RE_CODIGO_CAJERO.test(t));
  if (!candidatos.length) return null;
  const conocido = candidatos.find((t) => CAJEROS[t]);
  return conocido ?? candidatos[candidatos.length - 1]!;
}

/** Los reportes truncan el usuario del cajero; lo reconciliamos por prefijo. */
export function normalizarCajero(codigo: string) {
  const c = codigo.toUpperCase();
  if (CAJEROS[c]) return c;
  const igual = Object.keys(CAJEROS).find((k) => k.startsWith(c) || c.startsWith(k));
  if (igual) return igual;
  return esCodigoCajero(c) ? c : c;
}

/* ------------------------------- REPFACMES ------------------------------- */

const RE_VENTA =
  /^\s*(\d{2}\/\d{2}\/\d{2})\s+(\d+)\s+(\d+)\s+([A-ZÑ]{3,5})\s+(CO|CR)\s+(\d+)\s+(.+?)\s+(\d{1,3})\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{2})(?:\s+\d{2})?\s*$/;

const RE_ABONO =
  /^\s*(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+([A-Z])\s+([A-Z][A-Z0-9]{3,20})\s+(.+?)\s+([A-ZÑ]{3,22})\s+(-?[\d,]+\.\d{2})\s*$/;

export function parseRepfacmes(texto: string): DatosRepfacmes {
  const ventas: VentaFila[] = [];
  const abonos: AbonoFila[] = [];

  for (const l of lineas(texto)) {
    const v = RE_VENTA.exec(l);
    if (v) {
      const cod = v[8]!;
      ventas.push({
        fecha: v[1]!,
        factura: v[3]!,
        tipo: v[4]!,
        condicion: v[5] as "CO" | "CR",
        cliente: v[7]!.trim(),
        vendedor: VENDEDORES[cod] ? cod : VENDEDOR_POR_DEFECTO,
        subtotal: num(v[9]),
        itbms: num(v[10]),
        total: num(v[11]),
      });
      continue;
    }
    const cajero = detectarCajero(l);
    if (!cajero) continue; // sin usuario de caja no es una fila de recibo
    const a = RE_ABONO.exec(l);
    if (a) {
      abonos.push({
        fecha: a[1]!,
        recibo: a[2]!,
        cajero,
        cliente: a[5]!.trim(),
        monto: num(a[7]),
      });
      continue;
    }
    // Respaldo: fila de recibo con otro orden de columnas.
    const montos = l.match(/-?[\d,]+\.\d{2}/g);
    if (!montos?.length) continue;
    const fecha = l.match(/\d{2}\/\d{2}\/\d{2,4}/)?.[0];
    if (!fecha) continue;
    abonos.push({
      fecha,
      recibo: l.match(/\b\d{3,10}\b/)?.[0] ?? "",
      cajero,
      cliente: "",
      monto: num(montos[montos.length - 1]),
    });
  }

  const suma = (f: (v: VentaFila) => boolean, k: "subtotal" | "total") =>
    ventas.filter(f).reduce((s, v) => s + v[k], 0);
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const totales = {
    contado_sin: r2(suma((v) => v.condicion === "CO", "subtotal")),
    contado_con: r2(suma((v) => v.condicion === "CO", "total")),
    credito_sin: r2(suma((v) => v.condicion === "CR", "subtotal")),
    credito_con: r2(suma((v) => v.condicion === "CR", "total")),
    total_sin: r2(suma(() => true, "subtotal")),
    total_con: r2(suma(() => true, "total")),
    itbms: r2(ventas.reduce((s, v) => s + v.itbms, 0)),
  };

  const mapaV = new Map<string, { contado: number; credito: number }>();
  for (const v of ventas) {
    const e = mapaV.get(v.vendedor) ?? { contado: 0, credito: 0 };
    if (v.condicion === "CO") e.contado += v.total;
    else e.credito += v.total;
    mapaV.set(v.vendedor, e);
  }
  const por_vendedor = [...mapaV.entries()]
    .map(([codigo, e]) => ({
      codigo,
      nombre: VENDEDORES[codigo] ?? `VENDEDOR ${codigo}`,
      contado: r2(e.contado),
      credito: r2(e.credito),
      total: r2(e.contado + e.credito),
    }))
    .sort((a, b) => Number(a.codigo) - Number(b.codigo));

  const mapaC = new Map<string, { total: number; recibos: number }>();
  for (const a of abonos) {
    const e = mapaC.get(a.cajero) ?? { total: 0, recibos: 0 };
    e.total += a.monto;
    e.recibos += 1;
    mapaC.set(a.cajero, e);
  }
  const por_cajero = [...mapaC.entries()]
    .map(([codigo, e]) => ({
      codigo,
      nombre: nombreCajero(codigo),
      total: r2(e.total),
      recibos: e.recibos,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    ventas,
    abonos,
    totales,
    por_vendedor,
    por_cajero,
    abonos_total: r2(abonos.reduce((s, a) => s + a.monto, 0)),
  };
}

/* ------------------------------- REPARTVEN ------------------------------- */

const RE_PRODUCTO =
  /^\s*(\S.*?)\s{2,}(\d{1,5})\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{2})\s+(-?[\d,]+\.\d{2})\s*$/;

export function parseRepartven(texto: string): DatosRepartven {
  const productos: ProductoVenta[] = [];
  for (const l of lineas(texto)) {
    if (/Reporte de Ventas|Producto\s+Descripci/i.test(l)) continue;
    const m = RE_PRODUCTO.exec(l);
    if (!m) continue;
    const izq = m[1]!.trim();
    const partes = izq.split(/\s{2,}/);
    const codigo = (partes[0] ?? izq).trim();
    const descripcion = (partes.slice(1).join(" ") || izq).trim();
    productos.push({
      codigo,
      descripcion,
      cantidad: Number(m[2]),
      ventas: num(m[3]),
      costo: num(m[4]),
      ganancia: num(m[5]),
    });
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    productos,
    total_ventas: r2(productos.reduce((s, p) => s + p.ventas, 0)),
    total_ganancia: r2(productos.reduce((s, p) => s + p.ganancia, 0)),
  };
}

/* ------------------------------- REPVALOR2 ------------------------------- */

const RE_CLASIF = /Clasificacion:\s*(\d+)\s+(.+?)\s*$/i;
const RE_TOTAL_CLASIF = /Total\s+Clasificacion-+>\s*([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/i;
const RE_ITEM_VALOR = /^\s*(\S+)\s+(.+?)\s+(\d{1,6})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s*$/;

export function parseRepvalor2(texto: string): DatosRepvalor2 {
  const clasificacion_por_codigo: Record<string, string> = {};
  const clasificaciones: DatosRepvalor2["clasificaciones"] = [];
  let actual = { codigo: "", nombre: "SIN CLASIFICAR", unidades: 0 };

  for (const l of lineas(texto)) {
    const c = RE_CLASIF.exec(l);
    if (c) {
      actual = { codigo: c[1]!, nombre: c[2]!.trim(), unidades: 0 };
      continue;
    }
    const t = RE_TOTAL_CLASIF.exec(l);
    if (t) {
      clasificaciones.push({
        codigo: actual.codigo,
        nombre: actual.nombre,
        costo: num(t[1]),
        venta: num(t[3]),
        unidades: actual.unidades,
      });
      continue;
    }
    const i = RE_ITEM_VALOR.exec(l);
    if (i) {
      const codigo = i[1]!.trim();
      if (/^total/i.test(codigo)) continue;
      clasificacion_por_codigo[codigo.toUpperCase()] = actual.nombre;
      actual.unidades += Number(i[3]);
    }
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    clasificacion_por_codigo,
    clasificaciones,
    total_costo: r2(clasificaciones.reduce((s, c) => s + c.costo, 0)),
    total_venta: r2(clasificaciones.reduce((s, c) => s + c.venta, 0)),
  };
}

/* ------------------------------- MOROSIDAD ------------------------------- */

/** Todos los montos con dos decimales de una línea (1,234.56 o 1.234,56). */
const MONTOS_G = /-?(?:\d{1,3}(?:[.,]\d{3})*|\d+)[.,]\d{2}/g;
const montosDe = (l: string) => l.match(MONTOS_G) ?? [];
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * REPMOROSOS: morosidad vencida (30, 60, 90, 120, 364, 365 días).
 * El total se busca en este orden: fila de totales del reporte, rótulo
 * "Morosidad:" y, como último recurso, la suma de las filas de clientes.
 */
export function parseRepmorosos(texto: string) {
  const ls = lineas(texto);
  const claves = ["30 días", "60 días", "90 días", "120 días", "364 días", "365 días"];
  const plazos: Record<string, number> = Object.fromEntries(claves.map((k) => [k, 0]));
  let filaTotales = 0;
  let etiqueta = 0;
  let cuentas = 0;
  let suma_filas = 0;

  ls.forEach((l, i) => {
    const mor = /Morosidad\s*:?\s*-*>?\s*(-?[\d.,]+[.,]\d{2})/i.exec(l);
    if (mor) etiqueta = num(mor[1]);

    const montos = montosDe(l);
    const esTotal = /total/i.test(l);
    const cnt = /^\s*(?:total[^\d]*)?(\d{1,5})\s/i.exec(l);

    // Fila de totales: (cuentas) + 6 plazos + total general.
    if (montos.length >= 7 && (esTotal || cnt)) {
      if (cnt) cuentas = Number(cnt[1]);
      const seis = montos.slice(-7, -1);
      claves.forEach((k, idx) => (plazos[k] = num(seis[idx])));
      filaTotales = num(montos[montos.length - 1]);
      return;
    }
    // Fila de cliente: el último monto es su saldo moroso.
    if (!esTotal && montos.length >= 1 && /^\s*\d{3,6}\b/.test(l)) {
      suma_filas += num(montos[montos.length - 1]);
      return;
    }
    void i;
  });

  // El rótulo "Morosidad:" suele traer el valor en la línea siguiente.
  if (!etiqueta) {
    const idx = ls.findIndex((l) => /Morosidad\s*:/i.test(l));
    if (idx >= 0) {
      for (const l of ls.slice(idx, idx + 4)) {
        const m = /(-?[\d.,]+[.,]\d{2})\s*$/.exec(l.trim());
        if (m) {
          etiqueta = num(m[1]);
          break;
        }
      }
    }
  }

  const suma_plazos = r2(Object.values(plazos).reduce((s, v) => s + v, 0));
  const total = filaTotales || etiqueta || suma_plazos || r2(suma_filas);
  return { total, plazos, cuentas, etiqueta, suma_plazos, suma_filas: r2(suma_filas) };
}

/** REPMOROSOS2: morosidad no vencida (0, 30, 60, 90, 120, 120+ días). */
export function parseRepmorosos2(texto: string) {
  const ls = lineas(texto);
  const claves = ["0 días", "30 días", "60 días", "90 días", "120 días", "más de 120"];
  const plazos: Record<string, number> = Object.fromEntries(claves.map((k) => [k, 0]));
  let total = 0;
  let saldo_actual = 0;
  let cuentas = 0;

  for (const l of ls) {
    const mor = /Total\s+Moroso\s*:?-*>?\s*(-?[\d.,]+[.,]\d{2})/i.exec(l);
    if (mor) total = num(mor[1]);

    const montos = montosDe(l);
    if (/total/i.test(l) && montos.length >= 7) {
      const cnt = /(\d{1,5})\s+-?[\d.,]+[.,]\d{2}/.exec(l);
      if (cnt) cuentas = Number(cnt[1]);
      const seis = montos.slice(-7, -1);
      claves.forEach((k, idx) => (plazos[k] = num(seis[idx])));
      saldo_actual = num(montos[montos.length - 1]);
    }
  }
  if (!total) {
    const idx = ls.findIndex((l) => /Total\s+Moroso/i.test(l));
    if (idx >= 0) {
      for (const l of ls.slice(idx, idx + 4)) {
        const m = /(-?[\d.,]+[.,]\d{2})\s*$/.exec(l.trim());
        if (m) {
          total = num(m[1]);
          break;
        }
      }
    }
  }
  const suma_plazos = r2(Object.values(plazos).reduce((s, v) => s + v, 0));
  return { total: total || suma_plazos, plazos, saldo_actual, cuentas, suma_plazos };
}


export function unirMorosidad(
  vencida: ReturnType<typeof parseRepmorosos>,
  noVencida: ReturnType<typeof parseRepmorosos2>,
): DatosMorosidad {
  return {
    vencida: { total: vencida.total, plazos: vencida.plazos },
    no_vencida: {
      total: noVencida.total,
      plazos: noVencida.plazos,
      saldo_actual: noVencida.saldo_actual,
      cuentas: noVencida.cuentas,
    },
  };
}

/* ------------------------------- REPCLIENTES ------------------------------- */

const RE_MONTO_SUELTO = /^-?[\d.]{1,12},\d{2}$|^-?[\d,]{1,12}\.\d{2}$/;

export function parseRepclientes(texto: string): DatosRepclientes {
  const clientes: DatosRepclientes["clientes"] = [];
  let total_saldo = 0;
  let cuentas = 0;

  for (const l of lineas(texto)) {
    const tot = /Total de Clientes\s*-*>\s*(\d+)\s+([\d.,]+)/i.exec(l);
    if (tot) {
      cuentas = Number(tot[1]);
      total_saldo = num(tot[2]);
      continue;
    }
    const m = /^\s*(\d{4,6})\s{1,}(.*)$/.exec(l);
    if (!m) continue;
    const cols = m[2]!.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    const idxSaldo = [...cols].reverse().findIndex((c) => RE_MONTO_SUELTO.test(c));
    if (idxSaldo < 0) continue;
    const pos = cols.length - 1 - idxSaldo;
    const saldo = num(cols[pos]);
    const nombre = (cols.slice(0, pos).join(" ") || "")
      .replace(/\b\d{1,2}-\d{1,4}-\d{1,5}\b/g, "")
      .replace(/\b\d{7,}\b/g, "")
      .replace(/\b\d{3,4}-\d{4}\b/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    clientes.push({ codigo: m[1]!, nombre: nombre || `CLIENTE ${m[1]}`, saldo });
  }

  if (!cuentas) cuentas = clientes.length;
  if (!total_saldo) total_saldo = Math.round(clientes.reduce((s, c) => s + c.saldo, 0) * 100) / 100;

  const alertas: AlertaCliente[] = [];
  for (const c of clientes) {
    if (c.saldo < 0)
      alertas.push({
        tipo: "saldo_negativo",
        cliente: `${c.codigo} · ${c.nombre}`,
        detalle: "Saldo en negativo: revisar por contabilidad.",
        monto: c.saldo,
      });
  }
  const porNombre = new Map<string, typeof clientes>();
  for (const c of clientes) {
    const k = c.nombre.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, "").trim();
    if (!k) continue;
    porNombre.set(k, [...(porNombre.get(k) ?? []), c]);
  }
  for (const [k, grupo] of porNombre) {
    if (grupo.length > 1)
      alertas.push({
        tipo: "duplicado",
        cliente: k,
        detalle: `Cliente repetido en ${grupo.length} cuentas: ${grupo.map((g) => g.codigo).join(", ")}`,
        monto: Math.round(grupo.reduce((s, g) => s + g.saldo, 0) * 100) / 100,
      });
  }
  return { clientes, total_saldo, cuentas, alertas };
}

/** Facturas repetidas en más de una cuenta (revisión de duplicidad). */
export function facturasDuplicadas(texto: string): AlertaCliente[] {
  const mapa = new Map<string, Set<string>>();
  for (const l of lineas(texto)) {
    const m = /^\s*(\d{4,6})\s+\d*\s*(.+?)\s+(\d{4,6})\s+\d{2}\/\d{2}\/\d{2}/.exec(l);
    if (!m) continue;
    const set = mapa.get(m[3]!) ?? new Set<string>();
    set.add(m[1]!);
    mapa.set(m[3]!, set);
  }
  const out: AlertaCliente[] = [];
  for (const [factura, cuentas] of mapa) {
    if (cuentas.size > 1)
      out.push({
        tipo: "factura_duplicada",
        cliente: [...cuentas].join(", "),
        detalle: `La factura ${factura} aparece en ${cuentas.size} cuentas distintas.`,
      });
  }
  return out;
}

/* -------------------------------- COMPRAS -------------------------------- */

export function parseRepcompfch(texto: string): DatosCompras {
  const compras: DatosCompras["compras"] = [];
  for (const l of lineas(texto)) {
    const m =
      /^\s*(\d{2}\/\d{2}\/\d{2,4})\s+(\S+)\s+(.+?)\s+(-?[\d.,]+\.\d{2}|-?[\d.]+,\d{2})\s*$/.exec(l);
    if (!m) continue;
    compras.push({
      fecha: m[1]!,
      documento: m[2]!,
      proveedor: m[3]!.trim(),
      monto: num(m[4]),
    });
  }
  return { compras, total: Math.round(compras.reduce((s, c) => s + c.monto, 0) * 100) / 100 };
}

/* ------------------------------ orquestador ------------------------------ */

export function parsePorReporte(reporte: string, texto: string): { datos: any; resumen: Record<string, any> } {
  switch (reporte) {
    case "repfacmes": {
      const d = parseRepfacmes(texto);
      return {
        datos: d,
        resumen: {
          facturas: d.ventas.length,
          recibos: d.abonos.length,
          ventas_totales: d.totales.total_con,
          abonos: d.abonos_total,
        },
      };
    }
    case "repartven": {
      const d = parseRepartven(texto);
      return { datos: d, resumen: { productos: d.productos.length, ventas: d.total_ventas } };
    }
    case "repvalor2": {
      const d = parseRepvalor2(texto);
      return {
        datos: d,
        resumen: {
          articulos: Object.keys(d.clasificacion_por_codigo).length,
          clasificaciones: d.clasificaciones.length,
          inventario_venta: d.total_venta,
        },
      };
    }
    case "repmorosos": {
      const d = parseRepmorosos(texto);
      return { datos: d, resumen: { morosidad_vencida: d.total, cuentas: d.cuentas } };
    }
    case "repmorosos2": {
      const d = parseRepmorosos2(texto);
      return {
        datos: d,
        resumen: { morosidad_no_vencida: d.total, saldo_actual: d.saldo_actual, cuentas: d.cuentas },
      };
    }
    case "repclientes": {
      const d = parseRepclientes(texto);
      d.alertas = [...d.alertas, ...facturasDuplicadas(texto)];
      return {
        datos: d,
        resumen: { clientes: d.cuentas, saldo_total: d.total_saldo, alertas: d.alertas.length },
      };
    }
    case "repcompfch": {
      const d = parseRepcompfch(texto);
      return { datos: d, resumen: { compras: d.compras.length, total: d.total } };
    }
    default:
      throw new Error(`Reporte no reconocido: ${reporte}`);
  }
}
