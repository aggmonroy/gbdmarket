import { FolderOpen } from "lucide-react";
import { fechaCorta, hoyISO } from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Encabezado, Raya, nombreArchivo, useBorrador } from "./hoja";

/** Destinatarios y columnas tal como en DOCUMENTOS_FORMATO.xlsx. */
const SECCIONES = [
  { nombre: "LIC. YESICA", columnas: ["Documento", "Detalle"], filas: 3 },
  { nombre: "LIC. VIELKA", columnas: ["Cliente", "Detalle", "Fecha de emisión", "Vendedor"], filas: 3 },
  { nombre: "LIC. DIOMEDES", columnas: ["Documento", "Detalle", "Fecha de emisión", "Valor"], filas: 5 },
  { nombre: "LIC. LIBRADA", columnas: ["Documento", "Detalle", "Fecha de emisión", "Monto"], filas: 8 },
] as const;
const DEVUELTOS = ["Documento", "Detalle", "Entrega"] as const;

type Seccion = { nombre: string; filas: string[][]; recibido: string };
type Documentos = { fecha: string; secciones: Seccion[]; preparadoPor: string; devueltos: string[][] };

const filasVacias = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => ""));
const crear = (): Documentos => ({
  fecha: hoyISO(),
  secciones: SECCIONES.map((s) => ({ nombre: s.nombre, filas: filasVacias(s.filas, s.columnas.length), recibido: "" })),
  preparadoPor: "ANA GOMEZ",
  devueltos: filasVacias(8, DEVUELTOS.length),
});

function TablaDocs({
  columnas,
  filas,
  onChange,
  prefijo,
}: {
  columnas: readonly string[];
  filas: string[][];
  onChange: (f: string[][]) => void;
  prefijo: string;
}) {
  const setCelda = (i: number, j: number, v: string) => onChange(filas.map((f, a) => (a === i ? f.map((x, b) => (b === j ? v : x)) : f)));
  return (
    <>
      <table className="fmt-tabla">
        <thead>
          <tr>
            <th style={{ width: "6%" }}>#</th>
            {columnas.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              {columnas.map((c, j) => (
                <td key={c}>
                  <Celda
                    value={f[j] ?? ""}
                    onChange={(v) => setCelda(i, j, v)}
                    label={`${prefijo} ${c} fila ${i + 1}`}
                    type={c.startsWith("Fecha") ? "date" : "text"}
                    mostrar={c.startsWith("Fecha") ? fechaCorta(f[j] ?? "") : undefined}
                    numero={c === "Valor" || c === "Monto"}
                    align={c === "Valor" || c === "Monto" ? "right" : "left"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ControlFilas
        onAgregar={() => onChange([...filas, columnas.map(() => "")])}
        onQuitar={() => onChange(filas.slice(0, -1))}
        puedeQuitar={filas.length > 1}
      />
    </>
  );
}

/** Control de documentos enviados y recibidos de Línea Blanca. */
export function DocumentosEditor({ onVolver }: { onVolver: () => void }) {
  const [d, setD, reiniciar] = useBorrador<Documentos>("gbd_formato_documentos", crear);
  const setSeccion = (i: number, s: Partial<Seccion>) =>
    setD((x) => ({ ...x, secciones: x.secciones.map((y, j) => (j === i ? { ...y, ...s } : y)) }));

  return (
    <EditorFormato
      titulo="Control de documentos"
      icono={FolderOpen}
      orientacion="portrait"
      archivo={nombreArchivo("control-de-documentos", d.fecha)}
      ayuda="Registra los documentos que se entregan a cada licenciado y quién los recibe. Al final, los documentos devueltos o enviados a Línea Blanca."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado seccion="SECCIÓN LÍNEA BLANCA" titulo="CONTROL DE DOCUMENTOS ENVIADOS Y RECIBIDOS" />
      <div className="fmt-grid2">
        <Raya label="Fecha:" type="date" value={d.fecha} onChange={(v) => setD((x) => ({ ...x, fecha: v }))} mostrar={fechaCorta(d.fecha)} />
      </div>
      {d.secciones.map((s, i) => (
        <section key={i} className="fmt-bloque">
          <div className="fmt-bloque__tit">
            <Celda value={s.nombre} onChange={(v) => setSeccion(i, { nombre: v })} label={`Destinatario ${i + 1}`} bold />
          </div>
          <TablaDocs columnas={SECCIONES[i]?.columnas ?? ["Documento", "Detalle"]} filas={s.filas} onChange={(f) => setSeccion(i, { filas: f })} prefijo={s.nombre} />
          <div className="fmt-grid2">
            <Raya label="Recibido por:" value={s.recibido} onChange={(v) => setSeccion(i, { recibido: v })} />
          </div>
        </section>
      ))}
      <div className="fmt-grid2 fmt-espacio">
        <Raya label="Preparado por:" value={d.preparadoPor} onChange={(v) => setD((x) => ({ ...x, preparadoPor: v }))} />
      </div>
      <p className="fmt-banda">A CONTINUACIÓN FAVOR REGISTRAR DOCUMENTOS REMITIDOS A LÍNEA BLANCA</p>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">DOCUMENTOS DEVUELTOS O ENVIADOS A LÍNEA BLANCA</div>
        <TablaDocs columnas={DEVUELTOS} filas={d.devueltos} onChange={(f) => setD((x) => ({ ...x, devueltos: f }))} prefijo="Devueltos" />
      </section>
    </EditorFormato>
  );
}
