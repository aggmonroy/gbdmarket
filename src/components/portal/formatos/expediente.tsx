import { Fragment, type SetStateAction } from "react";
import { FolderOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SECCIONES_EXPEDIENTE,
  aplicarComunes,
  direccionCliente,
  expedienteInicial,
  paginasExpediente,
  vistaApc,
  vistaDeclaracion,
  vistaLey81,
  type Expediente,
  type SeccionExpediente,
} from "@/lib/expediente-credito";
import type { Declaracion } from "@/lib/formatos";
import { EditorFormato, nombreArchivo, useBorrador } from "./hoja";
import { ApcHoja, DatosClienteHoja, DatosPersonalesHoja, DeclaracionHoja, type Apc, type DatosPersonales, type Setter } from "./requisitos";

const resolver = <T,>(u: SetStateAction<T>, actual: T): T => (typeof u === "function" ? (u as (x: T) => T)(actual) : u);

/** Un solo documento con los requisitos de crédito; cada parte se puede quitar o volver a añadir. */
export function ExpedienteCreditoEditor({ onVolver }: { onVolver: () => void }) {
  const [e, setE, reiniciar] = useBorrador<Expediente>("gbd_formato_expediente_credito", expedienteInicial);

  const setCliente: Setter<Expediente["cliente"]> = (u) => setE((x) => ({ ...x, cliente: resolver(u, x.cliente) }));
  const setApc: Setter<Apc> = (u) => setE((x) => aplicarComunes(x, resolver(u, vistaApc(x))));
  const setLey81: Setter<DatosPersonales> = (u) => setE((x) => aplicarComunes(x, resolver(u, vistaLey81(x))));
  const setDecl: Setter<Declaracion> = (u) =>
    setE((x) => {
      const n = resolver(u, vistaDeclaracion(x));
      const y = aplicarComunes(x, n);
      const direccion = n.direccion === direccionCliente(x.cliente) ? "" : n.direccion;
      return { ...y, declaracion: { ...n, direccion } };
    });
  const alternar = (id: SeccionExpediente, v: boolean) => setE((x) => ({ ...x, incluir: { ...x.incluir, [id]: v } }));

  const paginas = paginasExpediente(e.incluir);
  const hoja = (id: SeccionExpediente) => {
    switch (id) {
      case "cliente":
        return <DatosClienteHoja c={e.cliente} setC={setCliente} />;
      case "apc":
        return (
          <div className="fmt-exp-apc">
            <ApcHoja a={vistaApc(e)} setA={setApc} copias={1} />
          </div>
        );
      case "ley81":
        return <DatosPersonalesHoja p={vistaLey81(e)} setP={setLey81} />;
      case "declaracion":
        return <DeclaracionHoja d={vistaDeclaracion(e)} setD={setDecl} />;
    }
  };

  return (
    <EditorFormato
      titulo="Expediente de crédito"
      icono={FolderOpen}
      orientacion="portrait"
      archivo={nombreArchivo(`expediente-credito-${e.cliente.nombre || "cliente"}`, e.cliente.fecha)}
      ayuda="Llena la toma de datos del cliente: el nombre, la cédula, la fecha y el número de cliente se copian solos en la APC, la Ley 81 y la declaración de ingresos. Marca o desmarca los documentos que necesites."
      onVolver={onVolver}
      onReiniciar={reiniciar}
      antes={
        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm print:hidden">
          <span className="font-semibold">Documentos incluidos:</span>
          {SECCIONES_EXPEDIENTE.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={e.incluir[s.id]} onCheckedChange={(v) => alternar(s.id, v === true)} />
              {s.titulo}
            </label>
          ))}
        </div>
      }
    >
      {paginas.length === 0 && <p className="fmt-noprint">Marca al menos un documento para incluirlo.</p>}
      {paginas.map((secciones, i) => (
        <Fragment key={secciones.join("-")}>
          {i > 0 && <div className="fmt-salto" role="separator" aria-label="Salto de página" />}
          {secciones.map((id) => (
            <div key={id} className="fmt-exp-seccion">
              {hoja(id)}
            </div>
          ))}
        </Fragment>
      ))}
    </EditorFormato>
  );
}
