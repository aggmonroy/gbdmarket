import type { CalculadoProducto, CapacidadInfo, ClienteInfo, PlazoCuota, TipoCliente, TotalesGobierno } from "./pricing-gbd";
import { esAsociado, etiquetaTipoCliente } from "./pricing-gbd";
import { fmt } from "./pricing-gbd";
import logoIcono from "@/assets/calculadora/logo-icono.png";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Evita "tainted canvas": sin esto, toDataURL falla con imágenes remotas.
    if (/^https?:\/\//i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("no se pudo cargar imagen"));
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const tentative = cur ? cur + " " + w : w;
    if (ctx.measureText(tentative).width <= maxW) {
      cur = tentative;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

export async function generarImagenCotizacion({
  tipoCliente,
  calculados,
  contadoTotal,
  creditoTotal,
  planTotal,
  cliente,
  capacidad,
  promo,
}: {
  tipoCliente: TipoCliente;
  calculados: CalculadoProducto[];
  contadoTotal: number;
  creditoTotal: number;
  planTotal: PlazoCuota[];
  cliente?: ClienteInfo;
  capacidad?: CapacidadInfo;
  promo?: { precioEtiqueta: number; cuota3m: number; meses: number };
}): Promise<string> {
  const W = 850;


  // Pre-load product images
  const imgs = await Promise.all(
    calculados.map(async (p) => {
      if (!p.imagen) return null;
      try {
        return await loadImg(p.imagen);
      } catch {
        return null;
      }
    })
  );

  // Measure with a temp ctx
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;

  const productHeights = calculados.map((p, i) => {
    const hasImg = !!imgs[i];
    const textLeft = hasImg ? 170 : 56;
    const textMaxW = 770 - (textLeft - 40) - 16;
    let h = 20; // top padding
    h += 24; // nombre
    if (p.descripcion) {
      mctx.font = "bold 12px Arial";
      const lines = wrapLines(mctx, p.descripcion, textMaxW, 3);
      h += lines.length * 16 + 6;
    }
    h += 26; // precios row
    h += 14; // bottom padding
    if (hasImg) h = Math.max(h, 130);
    return h;
  });

  const camposCliente: Array<[string, string]> = [];
  if (cliente?.nombre?.trim()) camposCliente.push(["Nombre", cliente.nombre.trim()]);
  if (cliente?.cedula?.trim()) camposCliente.push(["Cédula", cliente.cedula.trim()]);
  if (cliente?.telefono?.trim()) camposCliente.push(["Teléfono", cliente.telefono.trim()]);
  if (cliente?.correo?.trim()) camposCliente.push(["Correo", cliente.correo.trim()]);
  if (cliente?.direccion?.trim()) camposCliente.push(["Dirección", cliente.direccion.trim()]);

  const filasCliente = Math.ceil(camposCliente.length / 2);
  const clienteBoxH = camposCliente.length ? 40 + filasCliente * 22 + 12 : 0;
  const clienteBox = clienteBoxH ? clienteBoxH + 14 : 0;
  const productsTotal = productHeights.reduce((a, b) => a + b + 10, 0);
  const totalRowsPlan = Math.ceil(planTotal.length / 2);
  const capacidadBox = capacidad ? 150 + 16 : 0;
  const promoBox = promo ? 150 + 16 : 0;

  const H =
    150 + // header
    50 + // titulo/fecha
    clienteBox +
    36 + // "Productos cotizados"
    productsTotal +
    14 +
    116 + // total contado
    16 + // plazos title
    totalRowsPlan * 66 +
    20 +
    promoBox +
    capacidadBox +
    62; // validez footer


  const canvas = document.createElement("canvas");
  canvas.width = W * ESCALA;
  canvas.height = H * ESCALA;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ESCALA, ESCALA);
  ctx.imageSmoothingQuality = "high";


  ctx.fillStyle = "#F4F9FF";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#002362";
  ctx.fillRect(0, 0, W, 150);

  try {
    const imgIcono = await loadImg(logoIcono);
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, 30, 90, 90, 14);
    ctx.fill();
    ctx.drawImage(imgIcono, 47, 37, 76, 76);
  } catch {
    // fallback: sin logo
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Cooperativa de Servicios Integrales", 150, 60);
  ctx.fillText("Gladys B. De Ducasa, R.L.", 150, 86);
  ctx.fillStyle = "#B0C6E5";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Sección Línea Blanca y Bordados", 150, 110);

  ctx.fillStyle = "#F4F9FF";
  ctx.font = "bold 13px Arial";
  ctx.fillText("WhatsApp: +507 6784-1941", 150, 132);

  let y = 190;
  ctx.fillStyle = "#002362";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Cotización", 40, y);

  const fecha = new Date().toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric" });
  ctx.font = "bold 13px Arial";
  ctx.fillStyle = "#68758A";
  ctx.fillText(`Fecha: ${fecha}  ·  Tipo: ${etiquetaTipoCliente(tipoCliente)}`, 40, y + 24);
  y += 50;

  if (camposCliente.length) {
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, y, 770, clienteBoxH, 10);
    ctx.fill();
    ctx.strokeStyle = "#DBE2EB";
    ctx.stroke();
    ctx.fillStyle = "#68758A";
    ctx.font = "bold 12px Arial";
    ctx.fillText("DATOS DEL CLIENTE", 56, y + 24);

    const etiquetaTipo = etiquetaTipoCliente(tipoCliente).toUpperCase();
    ctx.font = "bold 12px Arial";
    const tw = ctx.measureText(etiquetaTipo).width;
    ctx.fillStyle = "#F4F9FF";
    roundRect(ctx, 794 - tw - 20, y + 10, tw + 20, 22, 11);
    ctx.fill();
    ctx.strokeStyle = "#DBE2EB";
    ctx.stroke();
    ctx.fillStyle = "#002362";
    ctx.fillText(etiquetaTipo, 794 - tw - 10, y + 25);

    camposCliente.forEach(([label, value], i) => {
      const col = i % 2;
      const fila = Math.floor(i / 2);
      const x = 56 + col * 380;
      const yy = y + 48 + fila * 22;
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#68758A";
      ctx.fillText(label, x, yy);
      ctx.fillStyle = "#002362";
      ctx.font = "bold 13px Arial";
      const maxW = 360 - 90;
      let txt = value;
      while (ctx.measureText(txt).width > maxW && txt.length > 1) txt = txt.slice(0, -1);
      if (txt !== value) txt = txt.slice(0, -1) + "…";
      ctx.fillText(txt, x + 90, yy);
    });
    y += clienteBoxH + 14;
  }


  ctx.fillStyle = "#002362";
  ctx.font = "bold 16px Arial";
  ctx.fillText("Productos cotizados", 40, y);
  y += 18;

  calculados.forEach(({ nombre, descripcion, calc }, i) => {
    const rowH = productHeights[i];
    const img = imgs[i];
    const hasImg = !!img;

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, y, 770, rowH, 10);
    ctx.fill();
    ctx.strokeStyle = "#DBE2EB";
    ctx.stroke();

    if (hasImg && img) {
      // clip to rounded square for the thumbnail
      ctx.save();
      const ix = 56;
      const iy = y + 14;
      const isize = 100;
      roundRect(ctx, ix, iy, isize, isize, 10);
      ctx.clip();
      // cover fit
      const scale = Math.max(isize / img.width, isize / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, ix + (isize - dw) / 2, iy + (isize - dh) / 2, dw, dh);
      ctx.restore();
    }

    const textLeft = hasImg ? 170 : 56;
    const textMaxW = 770 - (textLeft - 40) - 16;

    let ty = y + 34;
    ctx.fillStyle = "#002362";
    ctx.font = "bold 15px Arial";
    ctx.fillText(nombre || `Producto ${i + 1}`, textLeft, ty);
    ty += 6;

    if (descripcion) {
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#535E6F";
      const lines = wrapLines(ctx, descripcion, textMaxW, 3);
      for (const line of lines) {
        ty += 16;
        ctx.fillText(line, textLeft, ty);
      }
      ty += 6;
    }

    ty += 18;
    const precioFinal = esAsociado(tipoCliente) ? calc.promoAsociado : calc.promoTercero;
    const precioCredito = esAsociado(tipoCliente) ? calc.precioCreditoAsociado : calc.precioCreditoTercero;
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#68758A";
    ctx.fillText("Contado:", textLeft, ty);
    ctx.fillStyle = "#002362";
    ctx.fillText(fmt(precioFinal), textLeft + 74, ty);
    ctx.fillStyle = "#68758A";
    ctx.fillText("Crédito:", textLeft + 240, ty);
    ctx.fillStyle = "#002362";
    ctx.fillText(fmt(precioCredito), textLeft + 310, ty);

    y += rowH + 10;
  });

  y += 4;
  ctx.fillStyle = "#002362";
  roundRect(ctx, 40, y, 770, 90, 14);
  ctx.fill();
  ctx.fillStyle = "#B0C6E5";
  ctx.font = "bold 13px Arial";
  ctx.fillText("TOTAL PAGO AL CONTADO", 60, y + 32);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px Arial";
  ctx.fillText(fmt(contadoTotal), 60, y + 68);
  y += 116;

  ctx.fillStyle = "#002362";
  ctx.font = "bold 16px Arial";
  ctx.fillText(`Plazos disponibles a crédito (total ${fmt(creditoTotal)})`, 40, y);
  y += 16;

  const colW = 770 / 2;
  planTotal.forEach((row, idx) => {
    const col = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const bx = 40 + col * (colW + 10);
    const by = y + rowIdx * 66;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, bx, by, colW - 10, 56, 10);
    ctx.fill();
    ctx.strokeStyle = "#DBE2EB";
    ctx.stroke();

    ctx.fillStyle = "#002362";
    ctx.font = "bold 14px Arial";
    ctx.fillText(`${row.meses} meses`, bx + 14, by + 22);
    ctx.font = "bold 15px Arial";
    ctx.fillText(fmt(row.cuotaMensual) + "/mes", bx + 14, by + 42);
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#68758A";
    ctx.fillText(fmt(row.letraQuincenal) + " quinc.", bx + 190, by + 42);
  });

  y += Math.ceil(planTotal.length / 2) * 66 + 20;

  if (promo) {
    const boxH = 150;
    ctx.fillStyle = "#E3EFFF";
    roundRect(ctx, 40, y, 770, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = "#1F6DD8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.save();
    roundRect(ctx, 40, y, 770, boxH, 14);
    ctx.clip();
    ctx.fillStyle = "#1F6DD8";
    ctx.fillRect(40, y, 770, 52);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px Arial";
    ctx.fillText(
      tipoCliente === "colaborador" ? "¡PROMOCIÓN EXCLUSIVA PARA COLABORADORES GBD!" : "¡PROMOCIÓN EXCLUSIVA PARA ASOCIADOS!",
      W / 2,
      y + 21
    );
    ctx.font = "bold 17px Arial";
    ctx.fillText(`${promo.meses} meses a precio de contado`, W / 2, y + 43);

    ctx.fillStyle = "#0C4C9E";
    ctx.font = "bold 11px Arial";
    ctx.fillText("PRECIO DE ETIQUETA", W / 2, y + 72);
    ctx.fillStyle = "#002362";
    ctx.font = "bold 26px Arial";
    ctx.fillText(fmt(promo.precioEtiqueta), W / 2, y + 99);

    const bw = 340;
    const cards: Array<[string, string]> = [
      ["ABONO INICIAL", fmt(promo.cuota3m)],
      ["QUINCENAL", fmt(promo.cuota3m / 2)],
    ];
    cards.forEach(([label, value], i) => {
      const bx = 56 + i * (bw + 18);
      const by = y + 108;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, bx, by, bw, 34, 10);
      ctx.fill();
      ctx.strokeStyle = "#BFD6F5";
      ctx.stroke();
      ctx.fillStyle = "#0C4C9E";
      ctx.font = "bold 10px Arial";
      ctx.fillText(label, bx + bw / 2, by + 14);
      ctx.fillStyle = "#002362";
      ctx.font = "bold 15px Arial";
      ctx.fillText(value, bx + bw / 2, by + 29);
    });
    ctx.textAlign = "left";

    y += boxH + 16;
  }



  if (capacidad) {
    const bg = capacidad.aprueba ? "#E4EEE0" : "#FBEAE4";
    const border = capacidad.aprueba ? "#B7D5B0" : "#E9C4B4";
    const boxH = 150;
    ctx.fillStyle = bg;
    roundRect(ctx, 40, y, 770, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.stroke();

    ctx.fillStyle = "#535E6F";
    ctx.font = "bold 12px Arial";
    ctx.fillText("EVALUACIÓN DE CAPACIDAD DE PAGO", 56, y + 22);

    ctx.fillStyle = "#002362";
    ctx.font = "bold 15px Arial";
    const resultado = capacidad.aprueba ? "Dentro del límite legal" : "Excede el límite legal";
    ctx.fillText(`Resultado: ${resultado}`, 56, y + 48);

    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#071123";
    const col1x = 56;
    const col2x = 440;
    let ly = y + 74;
    const line = (label: string, value: string, x: number, yy: number) => {
      ctx.fillStyle = "#68758A";
      ctx.fillText(label, x, yy);
      ctx.fillStyle = "#002362";
      ctx.fillText(value, x + 170, yy);
    };
    line("Ingreso mensual:", fmt(capacidad.ingreso), col1x, ly);
    line("Deuda actual:", fmt(capacidad.deudaActual), col2x, ly);
    ly += 20;
    line("Tope legal:", fmt(capacidad.ingreso * capacidad.topePct), col1x, ly);
    line("Disponible:", fmt(capacidad.limiteCuota), col2x, ly);
    ly += 20;
    line(`Cuota (${capacidad.plazoMeses}m):`, fmt(capacidad.cuotaPropuesta), col1x, ly);

    y += boxH + 16;
  }

  ctx.fillStyle = "#E3EFFF";
  roundRect(ctx, 40, y, 770, 42, 21);
  ctx.fill();
  ctx.fillStyle = "#0C4C9E";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Cotización válida por 30 días o hasta agotar existencias", W / 2, y + 26);
  ctx.textAlign = "left";

  return canvasADataUrl(canvas);
}

/** toDataURL con fallback a toBlob para navegadores con límites de memoria/tamaño. */
async function canvasADataUrl(canvas: HTMLCanvasElement): Promise<string> {
  try {
    return canvas.toDataURL("image/png");
  } catch {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    if (!blob) throw new Error("No se pudo generar la imagen");
    return URL.createObjectURL(blob);
  }
}

function dataUrlABlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const tipo = /:(.*?);/.exec(head)?.[1] || "image/png";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

/**
 * Descarga compatible con Chrome, Firefox, Edge, Safari y navegadores móviles.
 * En móviles usa la hoja de compartir (guardar en Fotos/Archivos) porque la
 * descarga directa de data: URLs suele fallar en iOS/Android.
 */
export async function descargarArchivo(url: string, nombre: string) {
  let blob: Blob;
  try {
    blob = url.startsWith("data:") ? dataUrlABlob(url) : await (await fetch(url)).blob();
  } catch {
    window.open(url, "_blank");
    return;
  }

  const file = new File([blob], nombre, { type: blob.type || "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: nombre });
      return;
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return;
    }
  }

  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = nombre;
  a.rel = "noopener";
  document.body.appendChild(a);
  if (typeof a.download === "undefined") {
    window.open(objUrl, "_blank");
  } else {
    a.click();
  }
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objUrl), 15000);
  if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 15000);
}


// ============================================================
// IMAGEN — Cotización institucional (Gobierno)
// ============================================================
export async function generarImagenGobierno({
  totales,
  cliente,
}: {
  totales: TotalesGobierno;
  cliente?: ClienteInfo;
}): Promise<string> {
  const W = 1000;
  const rowH = 62;
  const imgs = await Promise.all(
    totales.lineas.map(async (l) => {
      if (!l.imagen) return null;
      try {
        return await loadImg(l.imagen);
      } catch {
        return null;
      }
    })
  );

  const infoLineas: Array<[string, string]> = [
    ["Fecha", new Date().toLocaleDateString("es-PA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
    ["Nombre", cliente?.nombre || "—"],
    ["RUC", cliente?.ruc || "—"],
    ["Cédula", cliente?.cedula || "—"],
    ["Dirección", cliente?.direccion || "—"],
    ["Teléfono", cliente?.telefono || "—"],
    ["Condiciones de pago", cliente?.condicionesPago || "Contado"],
    ["Observaciones", cliente?.observaciones || "VÁLIDO 30 DÍAS"],
  ];

  const headerH = 150;
  const infoH = infoLineas.length * 22 + 24;
  const H = headerH + 46 + infoH + 34 + (totales.lineas.length + 1) * rowH + 120;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#002362";
  ctx.fillRect(0, 0, W, headerH);
  try {
    const logo = await loadImg(logoIcono);
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, 30, 90, 90, 14);
    ctx.fill();
    ctx.drawImage(logo, 47, 37, 76, 76);
  } catch {
    // sin logo
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 19px Arial";
  ctx.fillText("Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L.", 150, 58);
  ctx.fillStyle = "#B0C6E5";
  ctx.font = "bold 14px Arial";
  ctx.fillText("SECCIÓN LÍNEA BLANCA · RUC 1-236-63 DV 20", 150, 84);
  ctx.fillText("Calle Minsin y Gringa — Las Tablas, Prov. Los Santos", 150, 106);
  ctx.fillStyle = "#F4F9FF";
  ctx.fillText("WhatsApp: +507 6784-1941", 150, 130);

  let y = headerH + 40;
  ctx.fillStyle = "#002362";
  ctx.font = "bold 24px Arial";
  ctx.fillText("Cotización institucional", 40, y);
  y += 20;

  infoLineas.forEach(([label, value]) => {
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#68758A";
    ctx.fillText(`${label}:`, 40, y + 18);
    ctx.fillStyle = "#002362";
    let txt = value;
    while (ctx.measureText(txt).width > W - 260 && txt.length > 1) txt = txt.slice(0, -1);
    ctx.fillText(txt, 220, y + 18);
    y += 22;
  });
  y += 20;

  // Tabla
  const cols = [
    { label: "Imagen", w: 70, align: "center" as const },
    { label: "Modelo", w: 130, align: "left" as const },
    { label: "Nombre del producto", w: 290, align: "left" as const },
    { label: "Cant.", w: 60, align: "center" as const },
    { label: "P. unit.", w: 90, align: "right" as const },
    { label: "Subtotal", w: 100, align: "right" as const },
    { label: "ITBMS", w: 80, align: "right" as const },
    { label: "P. Total", w: 100, align: "right" as const },
  ];
  const tableX = 20;
  const tableW = cols.reduce((a, c) => a + c.w, 0);

  ctx.fillStyle = "#002362";
  ctx.fillRect(tableX, y, tableW, 30);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px Arial";
  let cx = tableX;
  cols.forEach((c) => {
    ctx.textAlign = c.align === "right" ? "right" : c.align === "center" ? "center" : "left";
    const tx = c.align === "right" ? cx + c.w - 8 : c.align === "center" ? cx + c.w / 2 : cx + 8;
    ctx.fillText(c.label, tx, y + 20);
    cx += c.w;
  });
  ctx.textAlign = "left";
  y += 30;

  totales.lineas.forEach((l, i) => {
    ctx.fillStyle = i % 2 ? "#F4F9FF" : "#FFFFFF";
    ctx.fillRect(tableX, y, tableW, rowH);
    ctx.strokeStyle = "#DBE2EB";
    ctx.strokeRect(tableX, y, tableW, rowH);

    const values = [
      "",
      l.referencia || "—",
      (l.detalle || "—").toUpperCase(),
      String(l.cantidad),
      l.precioUnitario.toFixed(2),
      l.subtotal.toFixed(2),
      l.itbms.toFixed(2),
      fmt(l.total),
    ];

    let x = tableX;
    cols.forEach((c, ci) => {
      if (ci === 0) {
        const img = imgs[i];
        if (img) {
          ctx.save();
          roundRect(ctx, x + 11, y + 6, 48, 48, 6);
          ctx.clip();
          const scale = Math.max(48 / img.width, 48 / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          ctx.drawImage(img, x + 11 + (48 - dw) / 2, y + 6 + (48 - dh) / 2, dw, dh);
          ctx.restore();
        }
        x += c.w;
        return;
      }
      ctx.font = ci === 7 ? "bold 12px Arial" : "12px Arial";
      ctx.fillStyle = ci === 7 ? "#002362" : "#071123";
      ctx.textAlign = c.align === "right" ? "right" : c.align === "center" ? "center" : "left";
      const tx = c.align === "right" ? x + c.w - 8 : c.align === "center" ? x + c.w / 2 : x + 8;
      if (ci === 2) {
        const lines = wrapLines(ctx, values[ci], c.w - 16, 3);
        lines.forEach((line, li) => ctx.fillText(line, tx, y + 22 + li * 15));
      } else {
        ctx.fillText(values[ci], tx, y + rowH / 2 + 4);
      }
      x += c.w;
    });
    ctx.textAlign = "left";
    y += rowH;
  });

  // Fila de totales
  ctx.fillStyle = "#E3EFFF";
  ctx.fillRect(tableX, y, tableW, rowH);
  ctx.strokeStyle = "#BFD6F5";
  ctx.strokeRect(tableX, y, tableW, rowH);
  ctx.fillStyle = "#002362";
  ctx.font = "bold 13px Arial";
  const anchoAntesSubtotal = cols.slice(0, 5).reduce((a, c) => a + c.w, 0);
  ctx.textAlign = "right";
  ctx.fillText("TOTALES", tableX + anchoAntesSubtotal - 8, y + rowH / 2 + 4);
  let tx2 = tableX + anchoAntesSubtotal;
  [totales.subtotal.toFixed(2), totales.itbms.toFixed(2), fmt(totales.total)].forEach((v, i) => {
    const c = cols[5 + i];
    ctx.fillText(v, tx2 + c.w - 8, y + rowH / 2 + 4);
    tx2 += c.w;
  });
  ctx.textAlign = "left";
  y += rowH + 26;

  if (totales.descuento > 0) {
    ctx.fillStyle = "#0C4C9E";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`Descuento institucional aplicado: ${fmt(totales.descuento)}`, 40, y);
    y += 22;
  }

  ctx.fillStyle = "#535E6F";
  ctx.font = "bold 12px Arial";
  ctx.fillText("Ana Gómez — VENDEDOR · WhatsApp: 6784-1941", 40, y + 14);
  ctx.fillStyle = "#0C4C9E";
  ctx.fillText("Cotización válida por 30 días o hasta agotar existencias", 40, y + 34);

  return canvasADataUrl(canvas);
}
