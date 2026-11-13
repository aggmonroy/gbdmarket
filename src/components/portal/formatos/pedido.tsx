import { ShoppingCart } from "lucide-react";
import { UNIDADES_PEDIDO, dinero, fechaLarga, hoyISO, lineaPedidoVacia, totalLineaPedido, totalPedido, type LineaPedido } from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Encabezado, editarFila, nombreArchivo, useBorrador } from "./hoja";

type Pedido = { fecha: string; proveedor: string; lineas: LineaPedido[]; preparadoPor: string };
const crear = (): Pedido => ({
  fecha: hoyISO(),
  proveedor: "",
  lineas: Array.from({ length: 5 }, lineaPedidoVacia),
  preparadoPor: "",
});

/** Pedido a proveedor (formato_de_pedido.xlsx). El proveedor se escribe a mano. */
export function PedidoEditor({ onVolver }: { onVolver: () => void }) {
  const [p, setP, reiniciar] = useBorrador<Pedido>("gbd_formato_pedido", crear);
  const setLinea = (i: number, k: keyof LineaPedido, v: string) => setP((d) => ({ ...d, lineas: editarFila(d.lineas, i, k, v) }));

  return (
    <EditorFormato
      titulo="Pedido a proveedor"
      icono={ShoppingCart}
      orientacion="portrait"
      archivo={nombreArchivo(`pedido-${p.proveedor || "proveedor"}`, p.fecha)}
      ayuda="Escribe el nombre del proveedor a mano. El total de cada fila es cantidad × precio."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado
        seccion="SECCIÓN MUEBLERÍA Y BORDADOS"
        titulo={
          <span className="fmt-inline">
            PEDIDO PARA
            <span className="fmt-w-60">
              <Celda value={p.proveedor} onChange={(v) => setP((d) => ({ ...d, proveedor: v.toUpperCase() }))} placeholder="(PROVEEDOR)" label="Proveedor" align="center" bold mostrar={p.proveedor || "(PROVEEDOR)"} />
            </span>
          </span>
        }
      >
        <div className="fmt-head__fecha">
          <span className="fmt-w-40">
            <Celda type="date" value={p.fecha} onChange={(v) => setP((d) => ({ ...d, fecha: v }))} mostrar={fechaLarga(p.fecha)} label="Fecha" align="center" />
          </span>
        </div>
      </Encabezado>
      <table className="fmt-tabla">
        <colgroup>
          <col style={{ width: "9%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "34%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={2}>CANTIDAD</th>
            <th>MODELO</th>
            <th>DESCRIPCIÓN</th>
            <th>PRECIO</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {p.lineas.map((l, i) => (
            <tr key={i}>
              <td><Celda numero align="center" value={l.cantidad} onChange={(v) => setLinea(i, "cantidad", v)} label={`Cantidad fila ${i + 1}`} /></td>
              <td><Celda opciones={UNIDADES_PEDIDO} value={l.unidad} onChange={(v) => setLinea(i, "unidad", v)} label={`Unidad fila ${i + 1}`} align="center" /></td>
              <td><Celda value={l.modelo} onChange={(v) => setLinea(i, "modelo", v)} label={`Modelo fila ${i + 1}`} /></td>
              <td><Celda value={l.descripcion} onChange={(v) => setLinea(i, "descripcion", v)} label={`Descripción fila ${i + 1}`} /></td>
              <td><Celda numero align="right" value={l.precio} onChange={(v) => setLinea(i, "precio", v)} label={`Precio fila ${i + 1}`} /></td>
              <td className="r">{totalLineaPedido(l) ? dinero(totalLineaPedido(l)) : ""}</td>
            </tr>
          ))}
          <tr className="fmt-total">
            <td colSpan={5} className="r">TOTAL DEL PEDIDO B/.</td>
            <td className="r">{dinero(totalPedido(p.lineas))}</td>
          </tr>
        </tbody>
      </table>
      <ControlFilas
        onAgregar={() => setP((d) => ({ ...d, lineas: [...d.lineas, lineaPedidoVacia()] }))}
        onQuitar={() => setP((d) => ({ ...d, lineas: d.lineas.slice(0, -1) }))}
        puedeQuitar={p.lineas.length > 1}
      />
      <div className="fmt-firmas fmt-firmas--uno">
        <div className="fmt-firma">
          <div className="fmt-firma__v">
            <Celda value={p.preparadoPor} onChange={(v) => setP((d) => ({ ...d, preparadoPor: v }))} align="center" label="Preparado por" />
          </div>
          <div className="fmt-firma__pie">Preparado por</div>
        </div>
      </div>
    </EditorFormato>
  );
}
