/**
 * Lista de precios de proveedores (página externa). Al tocar «Copiar ficha» en un
 * artículo, el texto queda en el portapapeles y la calculadora lo convierte en producto.
 * «Copiar enlace» solo copia la dirección y no contiene modelo, descripción ni precio.
 */

export const LISTA_PROVEEDORES_URL = "https://claude.ai/artifact/MTi9cm8qKR35HAj3MjkMhQ";

/** Distingue una dirección copiada sola de la ficha con datos del artículo. */
export function esSoloEnlace(texto: string | null | undefined): boolean {
  return /^https?:\/\/\S+$/i.test((texto ?? "").trim());
}

/** Campo de la calculadora que recibe el precio copiado. */
export const CAMPO_PRECIO_COPIADO = "precioProveedor" as const;

export type ArticuloCopiado = { modelo: string; descripcion: string; precio: number; proveedor?: string };

const PRECIO_RE = /(?:B\/\.?|US\$|\$)\s*-?\d[\d,]*(?:\.\d+)?|-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+\.\d{2}\b/i;

/** "B/. 1,250.50" / "$1,250.50" / "1250.5" → 1250.5 */
export function leerPrecio(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0;
  if (typeof v !== "string") return 0;
  const limpio = v.replace(/B\/\.?|US\$|\$|\s/gi, "").replace(/,/g, "");
  const m = limpio.match(/-?\d+(?:\.\d+)?/);
  const n = m ? Number(m[0]) : 0;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CLAVES = {
  modelo: ["modelo", "model", "codigo", "cod", "code", "referencia", "ref", "sku", "item"],
  descripcion: ["descripcion", "description", "desc", "detalle", "articulo", "producto", "nombre", "name"],
  precio: ["precio", "price", "costo", "cost", "valor", "p.unitario", "unitario", "monto", "precio proveedor", "precio costo"],
  proveedor: ["proveedor", "supplier", "marca", "brand"],
} as const;

function campoDe(etiqueta: string): keyof typeof CLAVES | null {
  const e = norm(etiqueta).replace(/[:.]+$/, "");
  for (const k of Object.keys(CLAVES) as (keyof typeof CLAVES)[]) {
    if ((CLAVES[k] as readonly string[]).some((c) => e === c || e.startsWith(`${c} `) || e.endsWith(` ${c}`))) return k;
  }
  return null;
}

/** Un código de modelo: sin espacios, con al menos un número, corto (ej. "LG-WT19DSB", "RT38K5930SL"). */
const pareceModelo = (s: string) => /^[A-Z0-9][A-Z0-9\-_/.]{2,24}$/i.test(s) && /\d/.test(s) && !PRECIO_SOLO.test(s);
const PRECIO_SOLO = /^(?:B\/\.?|US\$|\$)?\s*-?\d[\d,]*(?:\.\d+)?$/i;

function completar(a: Partial<ArticuloCopiado>): ArticuloCopiado | null {
  const precio = a.precio ?? 0;
  const modelo = (a.modelo ?? "").trim();
  const descripcion = (a.descripcion ?? "").trim();
  if (precio <= 0 || (!modelo && !descripcion)) return null;
  return { modelo, descripcion, precio, ...(a.proveedor?.trim() ? { proveedor: a.proveedor.trim() } : {}) };
}

function desdeObjeto(o: Record<string, unknown>): ArticuloCopiado | null {
  const a: Partial<ArticuloCopiado> = {};
  for (const [k, v] of Object.entries(o)) {
    const campo = campoDe(k);
    if (!campo || v == null) continue;
    if (campo === "precio") a.precio ??= leerPrecio(v);
    else if (!a[campo]) a[campo] = String(v);
  }
  return completar(a);
}

/** Celdas de una fila (tabla copiada, "|" o " - "): precio, modelo y el texto más largo como descripción. */
function desdeCeldas(celdas: string[]): ArticuloCopiado | null {
  const cs = celdas.map((c) => c.trim()).filter(Boolean);
  if (cs.length < 2) return null;
  const iPrecio = cs.findIndex((c) => PRECIO_SOLO.test(c) && leerPrecio(c) > 0 && /[.$,]|B\//.test(c));
  const iPrecio2 = iPrecio >= 0 ? iPrecio : cs.findIndex((c) => PRECIO_SOLO.test(c) && leerPrecio(c) > 0);
  if (iPrecio2 < 0) return null;
  const resto = cs.filter((_, i) => i !== iPrecio2 && !PRECIO_SOLO.test(cs[i]!));
  const iModelo = resto.findIndex(pareceModelo);
  const modelo = iModelo >= 0 ? resto[iModelo]! : "";
  const textos = resto.filter((_, i) => i !== iModelo);
  const descripcion = textos.sort((x, y) => y.length - x.length)[0] ?? "";
  return completar({ modelo, descripcion, precio: leerPrecio(cs[iPrecio2]) });
}

/** "Modelo: X", "Descripción: Y", "Precio: $Z" en líneas. */
function desdeEtiquetas(lineas: string[]): ArticuloCopiado | null {
  const a: Partial<ArticuloCopiado> = {};
  const sueltas: string[] = [];
  for (const l of lineas) {
    const m = l.match(/^\s*([^:=]{2,30})\s*[:=]\s*(.+)$/);
    const campo = m ? campoDe(m[1]!) : null;
    if (m && campo) {
      if (campo === "precio") a.precio ??= leerPrecio(m[2]);
      else if (!a[campo]) a[campo] = m[2]!.trim();
    } else if (l.trim()) sueltas.push(l.trim());
  }
  if (!a.precio) {
    const conPrecio = sueltas.find((s) => PRECIO_RE.test(s));
    if (conPrecio) a.precio = leerPrecio(conPrecio.match(PRECIO_RE)![0]);
  }
  if (!a.descripcion && sueltas.length) {
    a.descripcion = sueltas.filter((s) => !PRECIO_SOLO.test(s) && s !== a.modelo).sort((x, y) => y.length - x.length)[0];
  }
  if (!a.modelo) {
    const cod = sueltas.flatMap((s) => s.split(/\s+/)).find(pareceModelo);
    if (cod && Object.keys(a).length) a.modelo = cod;
  }
  if (!Object.keys(a).some((k) => k !== "precio") && !sueltas.length) return null;
  return completar(a);
}

/** Separa una línea en celdas si viene de una tabla. */
function celdasDe(linea: string): string[] | null {
  if (linea.includes("\t")) return linea.split("\t");
  if (linea.includes("|")) return linea.split("|");
  if (/\s[–—-]\s/.test(linea)) return linea.split(/\s[–—-]\s/);
  if (linea.includes(";")) return linea.split(";");
  return null;
}

/**
 * Convierte lo copiado de la lista de precios en uno o varios artículos.
 * Acepta JSON, filas de tabla (tabulador, "|", " - " o ";") y líneas "Etiqueta: valor".
 */
export function leerArticulosCopiados(texto: string | null | undefined): ArticuloCopiado[] {
  const t = (texto ?? "").trim();
  if (!t || t.length > 20000) return [];

  if (/^[[{]/.test(t)) {
    try {
      const j = JSON.parse(t) as unknown;
      const lista = Array.isArray(j) ? j : [j];
      return lista
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map(desdeObjeto)
        .filter((x): x is ArticuloCopiado => !!x);
    } catch {
      /* no era JSON */
    }
  }

  const lineas = t.split(/\r?\n/).filter((l) => l.trim());
  // Una fila por artículo (tabla copiada). Si hay encabezado, se usa para ubicar las columnas.
  const filas = lineas.map(celdasDe);
  if (filas.every(Boolean) && !lineas.every((l) => /^[^:=]{2,30}[:=]/.test(l))) {
    const [primera, ...resto] = filas as string[][];
    const campos = primera!.map(campoDe);
    if (campos.filter(Boolean).length >= 2 && resto.length) {
      return resto
        .map((f) => {
          const o: Record<string, string> = {};
          f.forEach((v, i) => {
            if (campos[i]) o[campos[i]!] = v;
          });
          return desdeObjeto(o);
        })
        .filter((x): x is ArticuloCopiado => !!x);
    }
    const arts = (filas as string[][]).map(desdeCeldas).filter((x): x is ArticuloCopiado => !!x);
    if (arts.length) return arts;
  }

  // Bloques separados por línea en blanco, cada uno con "Etiqueta: valor".
  const bloques = t.split(/\r?\n\s*\r?\n/);
  return bloques
    .map((b) => {
      const ls = b.split(/\r?\n/);
      if (ls.length === 1) {
        const celdas = celdasDe(ls[0]!);
        if (celdas) return desdeCeldas(celdas);
      }
      return desdeEtiquetas(ls);
    })
    .filter((x): x is ArticuloCopiado => !!x);
}
