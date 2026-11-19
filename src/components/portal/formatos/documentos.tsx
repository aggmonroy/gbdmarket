import { FolderOpen, X } from "lucide-react";
import { fechaCorta, hoyISO } from "@/lib/formatos";
import { Celda, EditorFormato, Encabezado, Raya, nombreArchivo, useBorrador } from "./hoja";

/** Destinatarios y columnas iniciales tal como en DOCUMENTOS_FORMATO.xlsx; todo se puede cambiar. */
const SECCIONES = [
  { nombre: "LIC. YESICA", columnas: ["Documento", "Detalle"], filas: 3 },
  { nombre: "LIC. VIELKA", columnas: ["Cliente", "Detalle", "Fecha de emisión", "Vendedor"], filas: 3 },
  { nombre: "LIC. DIOMEDES", columnas: ["Documento", "Detalle", "Fecha de emisión", "Valor"], filas: 5 },
  { nombre: "LIC. LIBRADA", columnas: ["Documento", "Detalle", "Fecha de emisión", "Monto"], filas: 8 },
];
const DEVUELTOS = ["Documento", "Detalle", "Entrega"];

type Tabla = { columnas: string[]; filas: string[][] };
type Seccion = Tabla & { nombre: string; recibido: string };
type Documentos = { fecha: string; secciones: Seccion[]; preparadoPor: string; devueltos: Tabla };

const filasVacias = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => ""));
const seccionNueva = (): Seccion => ({ nombre: "", columnas: ["Documento", "Detalle"], filas: filasVacias(3, 2), recibido: "" });
const crear = (): Documentos => ({
  fecha: hoyISO(),
  secciones: SECCIONES.map((s) => ({
    nombre: s.nombre,
    columnas: [...s.columnas],
    filas: filasVacias(s.filas, s.columnas.length),
    recibido: "",
  })),
  preparadoPor: "ANA GOMEZ",
  devueltos: { columnas: [...DEVUELTOS], filas: filasVacias(8, DEVUELTOS.length) },
});

const esFecha = (c: string) => /^fecha/i.test(c.trim());
const esMonto = (c: string) => /^(valor|monto)/i.test(c.trim());

/** Tabla con columnas y filas que se pueden agregar, renombrar y quitar. */
function TablaDocs({ tabla, onChange, prefijo }: { tabla: Tabla; onChange: (t: Tabla) => void; prefijo: string }) {
  const { columnas, filas } = tabla;
  const setCelda = (i: number, j: number, v: string) =>
    onChange({ columnas, filas: filas.map((f, a) => (a === i ? f.map((x, b) => (b === j ? v : x)) : f)) });
  const renombrar = (j: number, v: string) => onChange({ columnas: columnas.map((c, b) => (b === j ? v : c)), filas });
  const quitarColumna = (j: number) =>
    onChange({ columnas: columnas.filter((_, b) => b !== j), filas: filas.map((f) => f.filter((_, b) => b !== j)) });
  const agregarColumna = () => onChange({ columnas: [...columnas, "Nueva columna"], filas: filas.map((f) => [...f, ""]) });
  const quitarFila = (i: number) => onChange({ columnas, filas: filas.filter((_, a) => a !== i) });
  const agregarFila = () => onChange({ columnas, filas: [...filas, columnas.map(() => "")] });

  return (
    <>
      <table className="fmt-tabla">
        <thead>
          <tr>
            <th style={{ width: "6%" }}>#</th>
            {columnas.map((c, j) => (
              <th key={j}>
                <div className="flex items-center gap-1">
                  <Celda value={c} onChange={(v) => renombrar(j, v)} label={`${prefijo}: nombre de la columna ${j + 1}`} align="center" bold />
                  {columnas.length > 1 && (
                    <button type="button" className="fmt-quitar fmt-noprint" aria-label={`Quitar columna ${c || j + 1}`} onClick={() => quitarColumna(j)}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </th>
            ))}
            <th className="fmt-noprint" style={{ width: "4%" }} />
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              {columnas.map((c, j) => (
                <td key={j}>
                  <Celda
                    value={f[j] ?? ""}
                    onChange={(v) => setCelda(i, j, v)}
                    label={`${prefijo} ${c} fila ${i + 1}`}
                    type={esFecha(c) ? "date" : "text"}
                    mostrar={esFecha(c) ? fechaCorta(f[j] ?? "") : undefined}
                    numero={esMonto(c)}
                    align={esMonto(c) ? "right" : "left"}
                  />
                </td>
              ))}
              <td className="c fmt-noprint">
                {filas.length > 1 && (
                  <button type="button" className="fmt-quitar" aria-label={`Quitar fila ${i + 1} de ${prefijo}`} onClick={() => quitarFila(i)}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fmt-noprint mt-1 flex flex-wrap gap-2">
        <button type="button" className="fmt-btn" onClick={agregarFila}>
          + Agregar fila
        </button>
        <button type="button" className="fmt-btn" onClick={agregarColumna} disabled={columnas.length >= 8}>
          + Agregar columna
        </button>
      </div>
    </>
  );
}

/** Control de documentos enviados y recibidos de Línea Blanca. */
export function DocumentosEditor({ onVolver }: { onVolver: () => void }) {
  const [d, setD, reiniciar] = useBorrador<Documentos>("gbd_formato_documentos_v2", crear);
  const setSeccion = (i: number, s: Partial<Seccion>) =>
    setD((x) => ({ ...x, secciones: x.secciones.map((y, j) => (j === i ? { ...y, ...s } : y)) }));
  const quitarSeccion = (i: number) => setD((x) => ({ ...x, secciones: x.secciones.filter((_, j) => j !== i) }));

  return (
    <EditorFormato
      titulo="Control de documentos"
      icono={FolderOpen}
      orientacion="portrait"
      archivo={nombreArchivo("control-de-documentos", d.fecha)}
      ayuda="Registra los documentos que se entregan a cada destinatario y quién los recibe. Puedes agregar o quitar destinatarios, columnas (y cambiarles el nombre) y filas. Al final, los documentos devueltos o enviados a Línea Blanca."
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
            <Celda value={s.nombre} onChange={(v) => setSeccion(i, { nombre: v })} label={`Destinatario ${i + 1}`} placeholder="Nombre del destinatario" bold />
            <button
              type="button"
              className="fmt-btn fmt-noprint shrink-0"
              onClick={() => {
                if (window.confirm(`¿Quitar el destinatario ${s.nombre || i + 1} y sus documentos?`)) quitarSeccion(i);
              }}
            >
              − Quitar destinatario
            </button>
          </div>
          <TablaDocs tabla={s} onChange={(t) => setSeccion(i, t)} prefijo={s.nombre || `Destinatario ${i + 1}`} />
          <div className="fmt-grid2">
            <Raya label="Recibido por:" value={s.recibido} onChange={(v) => setSeccion(i, { recibido: v })} />
          </div>
        </section>
      ))}
      <div className="fmt-noprint">
        <button type="button" className="fmt-btn" onClick={() => setD((x) => ({ ...x, secciones: [...x.secciones, seccionNueva()] }))}>
          + Agregar destinatario
        </button>
      </div>
      <div className="fmt-grid2 fmt-espacio">
        <Raya label="Preparado por:" value={d.preparadoPor} onChange={(v) => setD((x) => ({ ...x, preparadoPor: v }))} />
      </div>
      <p className="fmt-banda">A CONTINUACIÓN FAVOR REGISTRAR DOCUMENTOS REMITIDOS A LÍNEA BLANCA</p>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">DOCUMENTOS DEVUELTOS O ENVIADOS A LÍNEA BLANCA</div>
        <TablaDocs tabla={d.devueltos} onChange={(t) => setD((x) => ({ ...x, devueltos: t }))} prefijo="Devueltos" />
      </section>
    </EditorFormato>
  );
}
