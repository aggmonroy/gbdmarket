import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, ExternalLink } from "lucide-react";
import { esSoloEnlace, LISTA_PROVEEDORES_URL, leerArticulosCopiados, type ArticuloCopiado } from "@/lib/lista-proveedores";

/**
 * Botón a la lista de precios de proveedores. Al volver a la calculadora, el artículo
 * copiado con «Copiar ficha» se agrega solo; si el teléfono no deja leer lo copiado,
 * se pega a mano. «Copiar enlace» no basta porque no incluye los datos del artículo.
 */
export function ListaProveedoresCard({ onAgregar }: { onAgregar: (a: ArticuloCopiado[]) => void }) {
  const abierta = useRef(false);
  const ultimo = useRef<string | null>(null);
  const [manual, setManual] = useState(false);
  const [texto, setTexto] = useState("");
  const agregarRef = useRef(onAgregar);
  agregarRef.current = onAgregar;

  /** Devuelve true si el texto traía artículos. */
  const procesar = (t: string, avisarSiVacio: boolean) => {
    const arts = leerArticulosCopiados(t);
    if (!arts.length) {
      if (avisarSiVacio) {
        toast.error(
          esSoloEnlace(t)
            ? "«Copiar enlace» solo copia la dirección. En la lista, toca «Copiar ficha» para traer modelo, descripción y precio."
            : "No encontré modelo y precio en lo copiado. En la lista, toca «Copiar ficha» en el artículo.",
        );
      }
      return false;
    }
    ultimo.current = t;
    agregarRef.current(arts);
    toast.success(
      arts.length === 1
        ? `Agregado: ${arts[0]!.modelo || arts[0]!.descripcion}`
        : `Se agregaron ${arts.length} artículos a la cotización`,
    );
    return true;
  };

  const leerPortapapeles = async () => {
    if (!navigator.clipboard?.readText) throw new Error("sin acceso");
    return navigator.clipboard.readText();
  };

  // Al regresar de la lista, toma lo copiado automáticamente.
  useEffect(() => {
    const alVolver = async () => {
      if (!abierta.current || document.visibilityState !== "visible") return;
      try {
        const t = await leerPortapapeles();
        if (t && t !== ultimo.current && procesar(t, false)) abierta.current = false;
      } catch {
        /* el navegador no deja leer sin tocar un botón: queda «Pegar artículo copiado» */
      }
    };
    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pegar = async () => {
    try {
      const t = await leerPortapapeles();
      if (procesar(t, true)) setManual(false);
    } catch {
      setManual(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#DBE2EB] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#535E6F]">Lista de precios de proveedores</p>
          <p className="text-[11px] text-[#68758A]">
            En la lista, toca «Copiar ficha» en el artículo (no «Copiar enlace») y regresa: se agrega con su modelo, descripción y precio de proveedor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={LISTA_PROVEEDORES_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              abierta.current = true;
            }}
            className="flex items-center gap-2 bg-[#1F6DD8] hover:bg-[#0054BD] transition-colors px-4 py-2.5 rounded-full text-sm font-bold text-white"
          >
            <ExternalLink size={16} /> Lista de precios de proveedores
          </a>
          <button
            type="button"
            onClick={pegar}
            className="flex items-center gap-2 border border-[#1F6DD8] text-[#1F6DD8] hover:bg-[#EAF2FD] transition-colors px-4 py-2.5 rounded-full text-sm font-bold"
          >
            <ClipboardPaste size={16} /> Pegar artículo copiado
          </button>
        </div>
      </div>
      {manual && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#535E6F]" htmlFor="pegar-articulo">
            Mantén presionado aquí, elige «Pegar» y toca «Agregar».
          </label>
          <textarea
            id="pegar-articulo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            className="w-full border border-[#DBE2EB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1F6DD8]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (procesar(texto, true)) {
                  setTexto("");
                  setManual(false);
                }
              }}
              className="bg-[#1F6DD8] hover:bg-[#0054BD] px-4 py-2 rounded-full text-sm font-bold text-white"
            >
              Agregar
            </button>
            <button type="button" onClick={() => setManual(false)} className="px-4 py-2 text-sm text-[#535E6F]">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
