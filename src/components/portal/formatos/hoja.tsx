import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Download, ImagePlus, Loader2, Printer, RotateCcw, X, type LucideIcon } from "lucide-react";
import logo from "@/assets/logo-cooperativa-gbd.png";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Orientacion = "portrait" | "landscape";

/** Borrador del formato en esta pestaña (se borra al cerrar el navegador; no va a la base de datos). */
export function useBorrador<T extends object>(clave: string, crear: () => T) {
  const crearRef = useRef(crear);
  crearRef.current = crear;
  const [datos, setDatos] = useState<T>(crear);
  const cargado = useRef(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(clave);
      if (raw) setDatos({ ...crearRef.current(), ...JSON.parse(raw) });
    } catch {
      sessionStorage.removeItem(clave);
    }
    cargado.current = true;
  }, [clave]);
  useEffect(() => {
    if (!cargado.current) return;
    try {
      sessionStorage.setItem(clave, JSON.stringify(datos));
    } catch {
      /* almacenamiento lleno: el formato sigue funcionando sin borrador */
    }
  }, [clave, datos]);
  const reiniciar = () => setDatos(crearRef.current());
  return [datos, setDatos, reiniciar] as const;
}

/** Imprime solo la hoja del formato en carta con la orientación indicada. */
export function imprimirHoja(orientacion: Orientacion) {
  const root = document.documentElement;
  const style = document.createElement("style");
  style.textContent = `@page { size: letter ${orientacion}; margin: 10mm; }`;
  document.head.appendChild(style);
  root.classList.add("print-formato");
  const limpiar = () => {
    root.classList.remove("print-formato");
    style.remove();
    window.removeEventListener("afterprint", limpiar);
  };
  window.addEventListener("afterprint", limpiar);
  window.print();
}

/** Genera una imagen PNG de la hoja tal como se imprime y la comparte (móvil) o descarga. */
export async function descargarHoja(el: HTMLElement, filename: string, titulo: string) {
  el.classList.add("fmt-exporting");
  try {
    await document.fonts.ready;
    await Promise.all(
      Array.from(el.querySelectorAll("img")).map((img) => img.decode?.().catch(() => undefined)),
    );
    const { default: html2canvas } = await import("html2canvas-pro");
    // Limita el tamaño del lienzo (~16 MP) para que funcione también en iPhone.
    const area = Math.max(1, el.scrollWidth * el.scrollHeight);
    const scale = Math.max(1, Math.min(3, Math.sqrt(16_000_000 / area)));
    const canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff", logging: false });
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo generar la imagen"))), "image/png"),
    );
    const file = new File([blob], filename, { type: "image/png" });
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: titulo });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } finally {
    el.classList.remove("fmt-exporting");
  }
}

export const nombreArchivo = (base: string, fecha?: string) =>
  `${base}${fecha ? `-${fecha}` : ""}.png`.replace(/[^\w.-]+/g, "-").toLowerCase();

/** Barra, ayuda y hoja editable de un formato. La hoja misma es el formulario. */
export function EditorFormato({
  titulo,
  icono: Icono,
  orientacion,
  archivo,
  ayuda,
  onVolver,
  onReiniciar,
  antes,
  despues,
  children,
}: {
  titulo: string;
  icono: LucideIcon;
  orientacion: Orientacion;
  archivo: string;
  ayuda?: ReactNode;
  onVolver: () => void;
  onReiniciar: () => void;
  antes?: ReactNode;
  despues?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function descargar() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await descargarHoja(ref.current, archivo, titulo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Formatos
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("¿Borrar lo escrito y volver al formato original?")) onReiniciar();
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
          </Button>
          <Button variant="outline" size="sm" onClick={descargar} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar imagen
          </Button>
          <Button size="sm" onClick={() => imprimirHoja(orientacion)}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>
      <div className="print:hidden">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Icono className="h-5 w-5 text-primary" /> {titulo}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ayuda ?? "Escribe directamente sobre el formato; las zonas sombreadas son editables."}
        </p>
      </div>
      {antes}
      <div className="overflow-x-auto rounded-md border border-border bg-background p-2 print:overflow-visible print:border-0 print:p-0">
        <div ref={ref} className={cn("fmt-sheet", orientacion === "landscape" && "fmt-sheet--landscape")}>
          {children}
        </div>
      </div>
      {despues}
    </div>
  );
}

type CeldaProps = {
  value: string;
  onChange: (v: string) => void;
  /** Texto que se ve al imprimir o descargar (por defecto el mismo valor). */
  mostrar?: ReactNode;
  align?: "left" | "center" | "right";
  type?: "text" | "date" | "time";
  numero?: boolean;
  multilinea?: number;
  opciones?: readonly string[];
  /** Sugerencias para elegir, permitiendo también escribir otro valor. */
  sugerencias?: readonly string[];
  placeholder?: string;
  label?: string;
  className?: string;
  bold?: boolean;
};

/** Campo editable dentro de la hoja; al imprimir/descargar se reemplaza por texto plano. */
export function Celda({
  value,
  onChange,
  mostrar,
  align = "left",
  type = "text",
  numero,
  multilinea,
  opciones,
  sugerencias,
  placeholder,
  label,
  className,
  bold,
}: CeldaProps) {
  const listaId = useId();
  const style = { textAlign: align, fontWeight: bold ? 700 : undefined } as const;
  const comunes = { "aria-label": label ?? placeholder, className: "fmt-in", style };
  let control: ReactNode;
  if (opciones) {
    control = (
      <select {...comunes} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" />
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (multilinea) {
    control = (
      <textarea
        {...comunes}
        rows={multilinea}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    control = (
      <input
        {...comunes}
        type={type}
        inputMode={numero ? "decimal" : undefined}
        list={sugerencias ? listaId : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(numero ? e.target.value.replace(/[^\d.,-]/g, "") : e.target.value)}
      />
    );
  }
  return (
    <>
      {control}
      {sugerencias && (
        <datalist id={listaId}>
          {sugerencias.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
      <span className={cn("fmt-out", multilinea && "fmt-out--block", className)} style={style}>
        {mostrar ?? value}
      </span>
    </>
  );
}

/** Línea de firma o dato: valor sobre la raya y texto debajo (como en los Excel). */
export function LineaDato({
  value,
  onChange,
  pie,
  bold,
  type,
  mostrar,
}: {
  value: string;
  onChange: (v: string) => void;
  pie: string;
  bold?: boolean;
  type?: "text" | "date";
  mostrar?: ReactNode;
}) {
  return (
    <div className="fmt-firma">
      <div className="fmt-firma__v">
        <Celda value={value} onChange={onChange} align="center" bold={bold} type={type} label={pie} mostrar={mostrar} />
      </div>
      <div className="fmt-firma__pie">{pie}</div>
    </div>
  );
}

/** "Etiqueta: ______" en una sola línea. */
export function Raya({
  label,
  value,
  onChange,
  type,
  sugerencias,
  mostrar,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "time" | "date";
  sugerencias?: readonly string[];
  mostrar?: ReactNode;
}) {
  return (
    <div className="fmt-raya">
      <span>{label}</span>
      <span className="fmt-raya__v">
        <Celda value={value} onChange={onChange} label={label} type={type} align="center" sugerencias={sugerencias} mostrar={mostrar} />
      </span>
    </div>
  );
}

/** Actualiza un campo de una fila de una lista sin mutar. */
export function editarFila<T extends object>(lista: T[], i: number, campo: keyof T, valor: T[keyof T]): T[] {
  return lista.map((f, j) => (j === i ? { ...f, [campo]: valor } : f));
}

/** Botones de agregar/quitar filas; no aparecen al imprimir. */
export function ControlFilas({ onAgregar, onQuitar, puedeQuitar }: { onAgregar: () => void; onQuitar: () => void; puedeQuitar: boolean }) {
  return (
    <div className="fmt-noprint mt-1 flex gap-2">
      <button type="button" className="fmt-btn" onClick={onAgregar}>
        + Agregar fila
      </button>
      {puedeQuitar && (
        <button type="button" className="fmt-btn" onClick={onQuitar}>
          − Quitar última fila
        </button>
      )}
    </div>
  );
}

/** Encabezado institucional de los formatos (logo, cooperativa, sección y título). */
export function Encabezado({ seccion, titulo, children }: { seccion?: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="fmt-head">
      <img src={logo} alt="Cooperativa GBD" />
      <div className="fmt-head__txt">
        <div className="fmt-head__coop">COOPERATIVA DE SERVICIOS INTEGRALES GLADYS B. DE DUCASA, R.L.</div>
        {seccion && <div className="fmt-head__sec">{seccion}</div>}
        <div className="fmt-head__tit">{titulo}</div>
        {children}
      </div>
    </div>
  );
}

export type ImagenAnexa = { id: string; src: string; nota: string };

/** Reduce la foto (máx. 1600 px, JPEG) para que imprima nítida sin llenar la memoria del teléfono. */
async function comprimirImagen(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo leer la imagen");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Fotos de comprobantes anexas al formato; se imprimen y descargan con la hoja. */
export function AnexosImagenes({
  titulo = "Anexos: comprobantes",
  imagenes,
  onChange,
}: {
  titulo?: string;
  imagenes: ImagenAnexa[];
  onChange: (imgs: ImagenAnexa[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);

  async function agregar(files: FileList | null) {
    if (!files?.length) return;
    setCargando(true);
    const nuevas: ImagenAnexa[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} no es una imagen`);
        continue;
      }
      try {
        nuevas.push({ id: crypto.randomUUID(), src: await comprimirImagen(f), nota: "" });
      } catch {
        toast.error(`No se pudo leer ${f.name}`);
      }
    }
    onChange([...imagenes, ...nuevas]);
    setCargando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("fmt-anexos", imagenes.length === 0 && "fmt-anexos--vacio")}>
      <div className="fmt-anexos__tit">{titulo}</div>
      <div className="fmt-anexos__grid">
        {imagenes.map((img, i) => (
          <figure key={img.id} className="fmt-anexo">
            <img src={img.src} alt={img.nota || `Comprobante ${i + 1}`} />
            <figcaption>
              <Celda
                value={img.nota}
                onChange={(v) => onChange(imagenes.map((x) => (x.id === img.id ? { ...x, nota: v } : x)))}
                placeholder="Detalle (ej. Yappy B/. 25.00)"
                label={`Detalle del comprobante ${i + 1}`}
                align="center"
                mostrar={img.nota || `Comprobante ${i + 1}`}
              />
            </figcaption>
            <button
              type="button"
              className="fmt-noprint fmt-anexo__quitar"
              aria-label={`Quitar comprobante ${i + 1}`}
              onClick={() => onChange(imagenes.filter((x) => x.id !== img.id))}
            >
              <X className="h-4 w-4" />
            </button>
          </figure>
        ))}
      </div>
      <div className="fmt-noprint mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void agregar(e.target.files)}
        />
        <button type="button" className="fmt-btn inline-flex items-center gap-1" onClick={() => inputRef.current?.click()} disabled={cargando}>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Anexar fotos de comprobantes
        </button>
        <span className="text-xs text-muted-foreground">
          Capturas de WhatsApp (Yappy, ACH, BAC…). Las fotos no se guardan: se pierden al salir del formato.
        </span>
      </div>
    </div>
  );
}
