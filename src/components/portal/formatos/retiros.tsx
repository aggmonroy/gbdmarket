import { Search } from "lucide-react";
import { fechaCorta, hoyISO } from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Encabezado, Raya, editarFila, nombreArchivo, useBorrador } from "./hoja";

type Fila = { cedula: string; cliente: string; saldo: string };
type Retiros = { fecha: string; filas: Fila[] };
const fila = (): Fila => ({ cedula: "", cliente: "", saldo: "" });
const crear = (): Retiros => ({ fecha: hoyISO(), filas: Array.from({ length: 9 }, fila) });

/** Consulta de retiros (RETIROS_FORMATO.xlsx). */
export function RetirosEditor({ onVolver }: { onVolver: () => void }) {
  const [r, setR, reiniciar] = useBorrador<Retiros>("gbd_formato_retiros", crear);
  const setFila = (i: number, k: keyof Fila, v: string) => setR((d) => ({ ...d, filas: editarFila(d.filas, i, k, v) }));
  return (
    <EditorFormato
      titulo="Consulta de retiros"
      icono={Search}
      orientacion="portrait"
      archivo={nombreArchivo("consulta-de-retiros", r.fecha)}
      ayuda="Anota la cédula, si es cliente de Línea Blanca y su saldo."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado titulo="CONSULTA DE RETIROS" />
      <div className="fmt-grid2">
        <Raya label="Fecha:" type="date" value={r.fecha} onChange={(v) => setR((d) => ({ ...d, fecha: v }))} mostrar={fechaCorta(r.fecha)} />
      </div>
      <table className="fmt-tabla">
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "34%" }} />
          <col style={{ width: "34%" }} />
          <col style={{ width: "26%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>CÉDULA</th>
            <th>CLIENTE LÍNEA BLANCA (SÍ/NO)</th>
            <th>SALDO</th>
          </tr>
        </thead>
        <tbody>
          {r.filas.map((f, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              <td><Celda value={f.cedula} onChange={(v) => setFila(i, "cedula", v)} label={`Cédula fila ${i + 1}`} align="center" /></td>
              <td><Celda opciones={["SÍ", "NO"]} value={f.cliente} onChange={(v) => setFila(i, "cliente", v)} label={`Cliente Línea Blanca fila ${i + 1}`} align="center" /></td>
              <td><Celda numero value={f.saldo} onChange={(v) => setFila(i, "saldo", v)} label={`Saldo fila ${i + 1}`} align="right" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ControlFilas
        onAgregar={() => setR((d) => ({ ...d, filas: [...d.filas, fila()] }))}
        onQuitar={() => setR((d) => ({ ...d, filas: d.filas.slice(0, -1) }))}
        puedeQuitar={r.filas.length > 1}
      />
    </EditorFormato>
  );
}
