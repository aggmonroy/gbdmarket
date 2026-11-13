import { Clock } from "lucide-react";
import { fechaCorta, hoyISO, lineaHorasVacia, totalesHoras, type LineaHoras } from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Raya, editarFila, nombreArchivo, useBorrador, Encabezado } from "./hoja";

type Empleado = { nombre: string; lineas: LineaHoras[] };
type Horas = { desde: string; hasta: string; empleados: Empleado[] };
const empleado = (nombre = ""): Empleado => ({ nombre, lineas: Array.from({ length: 4 }, lineaHorasVacia) });
const crear = (): Horas => ({
  desde: "",
  hasta: hoyISO(),
  empleados: [empleado("MANUEL DIAZ"), empleado("SEBASTIAN TAYLOR"), empleado("ANA GOMEZ")],
});
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));

/** Control de horas (FORMATO_HORAS.xlsx): horas y tiempo aplicable; las llegadas tarde van en negativo. */
export function HorasEditor({ onVolver }: { onVolver: () => void }) {
  const [h, setH, reiniciar] = useBorrador<Horas>("gbd_formato_horas", crear);
  const setEmp = (i: number, e: Partial<Empleado>) =>
    setH((d) => ({ ...d, empleados: d.empleados.map((x, j) => (j === i ? { ...x, ...e } : x)) }));

  return (
    <EditorFormato
      titulo="Control de horas"
      icono={Clock}
      orientacion="portrait"
      archivo={nombreArchivo("control-de-horas", h.hasta)}
      ayuda="Anota las horas en decimales (30 minutos = 0.5). Las llegadas tarde se escriben en negativo (ej. -0.5) y se restan del total."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado titulo="CONTROL DE HORAS" />
      <div className="fmt-grid2">
        <Raya label="Fecha desde:" type="date" value={h.desde} onChange={(v) => setH((d) => ({ ...d, desde: v }))} mostrar={fechaCorta(h.desde)} />
        <Raya label="hasta:" type="date" value={h.hasta} onChange={(v) => setH((d) => ({ ...d, hasta: v }))} mostrar={fechaCorta(h.hasta)} />
      </div>
      {h.empleados.map((e, i) => {
        const tot = totalesHoras(e.lineas);
        const setLinea = (k: number, campo: keyof LineaHoras, v: string) => setEmp(i, { lineas: editarFila(e.lineas, k, campo, v) });
        return (
          <section key={i} className="fmt-bloque">
            <div className="fmt-bloque__tit fmt-inline">
              Empleado:
              <span className="fmt-w-60">
                <Celda value={e.nombre} onChange={(v) => setEmp(i, { nombre: v.toUpperCase() })} label={`Empleado ${i + 1}`} bold />
              </span>
              {h.empleados.length > 1 && (
                <button
                  type="button"
                  className="fmt-btn fmt-noprint ml-auto"
                  onClick={() => {
                    if (window.confirm(`¿Quitar a ${e.nombre || "este empleado"} del formato?`))
                      setH((d) => ({ ...d, empleados: d.empleados.filter((_, j) => j !== i) }));
                  }}
                >
                  Quitar empleado
                </button>
              )}
            </div>
            <table className="fmt-tabla">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Horas</th>
                  <th>Tiempo aplicable</th>
                  <th>Justificación</th>
                </tr>
              </thead>
              <tbody>
                {e.lineas.map((l, k) => (
                  <tr key={k}>
                    <td><Celda type="date" value={l.fecha} onChange={(v) => setLinea(k, "fecha", v)} mostrar={fechaCorta(l.fecha)} label={`Fecha fila ${k + 1}`} align="center" /></td>
                    <td><Celda type="time" value={l.desde} onChange={(v) => setLinea(k, "desde", v)} label={`Desde fila ${k + 1}`} align="center" /></td>
                    <td><Celda type="time" value={l.hasta} onChange={(v) => setLinea(k, "hasta", v)} label={`Hasta fila ${k + 1}`} align="center" /></td>
                    <td><Celda numero value={l.horas} onChange={(v) => setLinea(k, "horas", v)} label={`Horas fila ${k + 1}`} align="center" /></td>
                    <td><Celda numero value={l.aplicable} onChange={(v) => setLinea(k, "aplicable", v)} label={`Tiempo aplicable fila ${k + 1}`} align="center" /></td>
                    <td><Celda value={l.justificacion} onChange={(v) => setLinea(k, "justificacion", v)} label={`Justificación fila ${k + 1}`} /></td>
                  </tr>
                ))}
                <tr className="fmt-total">
                  <td colSpan={3}>TOTAL DE HORAS</td>
                  <td className="c">{fmt(tot.horas)}</td>
                  <td className="c">{fmt(tot.aplicable)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <ControlFilas
              onAgregar={() => setEmp(i, { lineas: [...e.lineas, lineaHorasVacia()] })}
              onQuitar={() => setEmp(i, { lineas: e.lineas.slice(0, -1) })}
              puedeQuitar={e.lineas.length > 1}
            />
          </section>
        );
      })}
      <div className="fmt-noprint mt-3">
        <button type="button" className="fmt-btn" onClick={() => setH((d) => ({ ...d, empleados: [...d.empleados, empleado()] }))}>
          + Agregar empleado
        </button>
      </div>
    </EditorFormato>
  );
}
