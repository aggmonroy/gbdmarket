import { createContext, useContext, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { registrarEmision } from "@/lib/formatos-registro.functions";
import { decidirEmision, type DocumentoAbierto, type EstadoDocumento } from "@/lib/formatos-registro";

export type ImagenGuardada = { id: string; src: string; nota: string };

/** Documento del registro que se abrió para consultarlo o reimprimirlo. */
export type Apertura = {
  id: string;
  numero: string;
  estado: EstadoDocumento;
  clave: string;
  datos: { borrador?: unknown; anexos?: ImagenGuardada[] } | null;
};

type Ctx = {
  token: string;
  formato: string;
  titulo: string;
  apertura: Apertura | null;
  doc: DocumentoAbierto | null;
  setDoc: (d: DocumentoAbierto | null) => void;
  contenido: MutableRefObject<{ clave: string; borrador: unknown } | null>;
  anexos: MutableRefObject<ImagenGuardada[] | null>;
};

const RegistroCtx = createContext<Ctx | null>(null);

export function RegistroProvider({
  token,
  formato,
  titulo,
  apertura,
  children,
}: {
  token: string;
  formato: string;
  titulo: string;
  apertura: Apertura | null;
  children: ReactNode;
}) {
  const [doc, setDoc] = useState<DocumentoAbierto | null>(null);
  const contenido = useRef<{ clave: string; borrador: unknown } | null>(null);
  const anexos = useRef<ImagenGuardada[] | null>(null);
  return (
    <RegistroCtx.Provider value={{ token, formato, titulo, apertura, doc, setDoc, contenido, anexos }}>
      {children}
    </RegistroCtx.Provider>
  );
}

/** JSON con llaves ordenadas: el mismo contenido da siempre el mismo texto. */
export function serializarEstable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(serializarEstable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .filter((k) => (v as any)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${serializarEstable((v as any)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

const huella = (borrador: unknown, anexos: ImagenGuardada[] | null | undefined) =>
  serializarEstable({ b: borrador, a: (anexos ?? []).map((x) => [x.id, x.nota]) });

const claveDoc = (clave: string) => `${clave}__documento`;

/** ¿El editor muestra un documento abierto desde el registro? */
export function useAperturaDe(clave: string) {
  const ctx = useContext(RegistroCtx);
  return ctx?.apertura && ctx.apertura.clave === clave ? ctx.apertura : null;
}

/**
 * Conecta el contenido de un formato con el registro de documentos emitidos.
 * Si se abrió un documento del registro, `aplicar` recibe su contenido guardado.
 */
export function useRegistrable<T>(clave: string, datos: T, aplicar: (borrador: T) => void) {
  const ctx = useContext(RegistroCtx);
  const apertura = useAperturaDe(clave);
  if (ctx) ctx.contenido.current = { clave, borrador: datos };
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  useEffect(() => {
    if (!ctx) return;
    if (apertura) {
      const borrador = (apertura.datos?.borrador ?? {}) as T;
      aplicarRef.current(borrador);
      ctx.setDoc({
        id: apertura.id,
        numero: apertura.numero,
        estado: apertura.estado,
        modo: "reabierto",
        original: huella(borrador, apertura.datos?.anexos),
      });
      return;
    }
    try {
      const raw = sessionStorage.getItem(claveDoc(clave));
      ctx.setDoc(raw ? (JSON.parse(raw) as DocumentoAbierto) : null);
    } catch {
      ctx.setDoc(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  /** Al restablecer el formato, el próximo documento será nuevo. */
  const olvidar = () => {
    sessionStorage.removeItem(claveDoc(clave));
    ctx?.setDoc(null);
  };
  return { reabierto: Boolean(apertura), olvidar };
}

/** Fotos anexas que viajan con el documento guardado (arqueos). */
export function useAnexosRegistrables(clave: string) {
  const ctx = useContext(RegistroCtx);
  const apertura = useAperturaDe(clave);
  const [anexos, setAnexos] = useState<ImagenGuardada[]>(() => apertura?.datos?.anexos ?? []);
  if (ctx) ctx.anexos.current = anexos;
  return [anexos, setAnexos] as const;
}

/** Registra el documento al imprimir o descargar; devuelve el documento vigente (si lo hay). */
export function useEmitir() {
  const ctx = useContext(RegistroCtx);
  const registrarFn = useServerFn(registrarEmision);
  return {
    doc: ctx?.doc ?? null,
    async emitir() {
      if (!ctx?.contenido.current) return;
      const { clave, borrador } = ctx.contenido.current;
      const anexos = ctx.anexos.current;
      const contenido = huella(borrador, anexos);
      const decision = decidirEmision(ctx.doc, contenido);
      if (decision === "ninguna") return;
      try {
        const r = await registrarFn({
          data: {
            token: ctx.token,
            accion: decision,
            id: ctx.doc?.id,
            formato: ctx.formato,
            clave,
            titulo: ctx.titulo,
            datos: anexos?.length ? { borrador, anexos } : { borrador },
          },
        });
        const doc: DocumentoAbierto = {
          id: r.id,
          numero: r.numero,
          estado: "vigente",
          modo: decision === "reimprimir" ? (ctx.doc?.modo ?? "reabierto") : "nuevo",
          original: contenido,
        };
        // Pinta el número en la hoja antes de que se imprima o descargue.
        flushSync(() => ctx.setDoc(doc));
        if (!ctx.apertura || ctx.apertura.clave !== clave) {
          try {
            sessionStorage.setItem(claveDoc(clave), JSON.stringify(doc));
          } catch {
            /* sin espacio: el documento ya quedó registrado */
          }
        }
        toast.success(r.nuevo ? `Documento registrado: ${r.numero}` : `Registrado en ${r.numero}`);
      } catch (err) {
        toast.error(
          `No se pudo guardar en el registro diario${err instanceof Error ? `: ${err.message}` : ""}. Se imprime de todos modos.`,
        );
      }
    },
  };
}

/** Número del documento y marca de ANULADO sobre la hoja (también al imprimir). */
export function MarcaDocumento({ doc }: { doc: DocumentoAbierto | null }) {
  if (!doc) return null;
  return (
    <>
      <div className="fmt-numdoc">Doc. Nº {doc.numero}</div>
      {doc.estado !== "vigente" && (
        <div className="fmt-anulado" aria-label={`Documento ${doc.estado}`}>
          {doc.estado === "anulado" ? "ANULADO" : "ELIMINADO"}
        </div>
      )}
    </>
  );
}
