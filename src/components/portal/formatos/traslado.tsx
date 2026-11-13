import { ArrowRightLeft, Truck } from "lucide-react";
import {
  SUCURSALES_TRASLADO,
  TRASLADO_CONFIG,
  dinero,
  errorSucursalesTraslado,
  fechaCorta,
  lineaTrasladoVacia,
  totalesTraslado,
  trasladoInicial,
  type LineaTraslado,
  type Traslado,
  type TrasladoTipo,
} from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Encabezado, Raya, editarFila, nombreArchivo, useBorrador } from "./hoja";

/** Traslados de Línea Blanca (TRASLADOS.xlsx) y envío a El Progreso (PROGRESO_TRASLADOS.xlsx). */
export function TrasladoEditor({ tipo, onVolver }: { tipo: TrasladoTipo; onVolver: () => void }) {
  const c = TRASLADO_CONFIG[tipo];
  const [t, setT, reiniciar] = useBorrador<Traslado>(`gbd_formato_traslado_${tipo}`, () => trasladoInicial(tipo));
  const set = <K extends keyof Traslado>(k: K, v: Traslado[K]) => setT((d) => ({ ...d, [k]: v }));
  const setLinea = (i: number, k: keyof LineaTraslado, v: string) => setT((d) => ({ ...d, lineas: editarFila(d.lineas, i, k, v) }));
  const tot = totalesTraslado(t.lineas);
  const error = errorSucursalesTraslado(t);
  const titulo = tipo === "progreso" ? "Envío a El Progreso" : "Traslados de Línea Blanca";

  return (
    <EditorFormato
      titulo={titulo}
      icono={tipo === "progreso" ? Truck : ArrowRightLeft}
      orientacion="portrait"
      archivo={nombreArchivo(tipo === "progreso" ? "envio-el-progreso" : "traslado-linea-blanca", t.fecha)}
      ayuda="Elige o escribe la sucursal de origen y la de destino. La fila TOTAL suma las cantidades y los precios."
      onVolver={onVolver}
      onReiniciar={reiniciar}
      antes={error ? <p className="text-sm font-medium text-destructive print:hidden">{error}</p> : undefined}
    >
      <Encabezado seccion="SECCIÓN LÍNEA BLANCA" titulo={c.titulo} />
      <div className="fmt-grid2">
        <Raya label="Fecha:" type="date" value={t.fecha} onChange={(v) => set("fecha", v)} mostrar={fechaCorta(t.fecha)} />
        <div />
        <Raya label="Sucursal de origen:" value={t.origen} onChange={(v) => set("origen", v)} sugerencias={SUCURSALES_TRASLADO} />
        <Raya label="Sucursal de destino:" value={t.destino} onChange={(v) => set("destino", v)} sugerencias={SUCURSALES_TRASLADO} />
      </div>
      <table className="fmt-tabla">
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "44%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Artículo</th>
            <th>Cant.</th>
            <th>Código</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          {t.lineas.map((l, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              <td><Celda value={l.articulo} onChange={(v) => setLinea(i, "articulo", v)} label={`Artículo fila ${i + 1}`} /></td>
              <td><Celda numero align="center" value={l.cantidad} onChange={(v) => setLinea(i, "cantidad", v)} label={`Cantidad fila ${i + 1}`} /></td>
              <td><Celda value={l.codigo} onChange={(v) => setLinea(i, "codigo", v)} label={`Código fila ${i + 1}`} align="center" /></td>
              <td><Celda numero align="right" value={l.precio} onChange={(v) => setLinea(i, "precio", v)} label={`Precio fila ${i + 1}`} /></td>
            </tr>
          ))}
          <tr className="fmt-total">
            <td />
            <td>TOTAL</td>
            <td className="c">{tot.cantidad}</td>
            <td />
            <td className="r">{dinero(tot.precio)}</td>
          </tr>
        </tbody>
      </table>
      <ControlFilas
        onAgregar={() => setT((d) => ({ ...d, lineas: [...d.lineas, lineaTrasladoVacia()] }))}
        onQuitar={() => setT((d) => ({ ...d, lineas: d.lineas.slice(0, -1) }))}
        puedeQuitar={t.lineas.length > 1}
      />
      <div className="fmt-grid2 fmt-espacio">
        <div className="fmt-grid-hora">
          <Raya label="Auditado por:" value={t.auditado} onChange={(v) => set("auditado", v)} />
          <Raya label="Hora:" type="time" value={t.auditadoHora} onChange={(v) => set("auditadoHora", v)} />
        </div>
        <div className="fmt-grid-hora">
          <Raya label="Autorizado por:" value={t.autorizado} onChange={(v) => set("autorizado", v)} />
          <Raya label="Hora:" type="time" value={t.autorizadoHora} onChange={(v) => set("autorizadoHora", v)} />
        </div>
        <Raya label="Entregado por:" value={t.entregadoSalida} onChange={(v) => set("entregadoSalida", v)} />
        <Raya label="Entregado por:" value={t.entregadoRetorno} onChange={(v) => set("entregadoRetorno", v)} />
        <Raya label="Recibido por:" value={t.recibidoSalida} onChange={(v) => set("recibidoSalida", v)} />
        <div className="fmt-grid-hora">
          <Raya label="Recibido por:" value={t.recibidoRetorno} onChange={(v) => set("recibidoRetorno", v)} />
          <Raya label="Hora:" type="time" value={t.recibidoRetornoHora} onChange={(v) => set("recibidoRetornoHora", v)} />
        </div>
        <Raya label="Hora de salida:" type="time" value={t.horaSalida} onChange={(v) => set("horaSalida", v)} />
        <Raya label="Hora de retorno:" type="time" value={t.horaRetorno} onChange={(v) => set("horaRetorno", v)} />
      </div>
    </EditorFormato>
  );
}
