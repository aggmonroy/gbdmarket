/**
 * Extracción de texto en el navegador de los reportes internos:
 * PDF, Excel (xls/xlsx), CSV y texto plano.
 */
import * as XLSX from "xlsx";

async function textoDePdf(file: File) {
  const pdfjs: any = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const partes: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Se reconstruyen las líneas por su posición vertical para conservar columnas.
    const filas = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as any[]) {
      if (typeof item.str !== "string" || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const arr = filas.get(y) ?? [];
      arr.push({ x: item.transform[4], s: item.str });
      filas.set(y, arr);
    }
    const ordenadas = [...filas.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, celdas] of ordenadas) {
      partes.push(
        celdas
          .sort((a, b) => a.x - b.x)
          .map((c) => c.s)
          .join("  "),
      );
    }
    partes.push("");
  }
  return partes.join("\n");
}

async function textoDeExcel(file: File) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return wb.SheetNames.map((n) => {
    const hoja = wb.Sheets[n]!;
    return `### Hoja: ${n}\n${XLSX.utils.sheet_to_csv(hoja, { FS: "  " })}`;
  }).join("\n\n");
}

/** Devuelve el texto legible de un reporte cargado por la administradora. */
export async function extraerTexto(file: File): Promise<string> {
  const nombre = file.name.toLowerCase();
  if (nombre.endsWith(".pdf")) return textoDePdf(file);
  if (/\.(xlsx|xlsm|xls|ods)$/.test(nombre)) return textoDeExcel(file);
  return file.text();
}

/** Convierte una imagen en data URL para la lectura con IA. */
export function aDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
