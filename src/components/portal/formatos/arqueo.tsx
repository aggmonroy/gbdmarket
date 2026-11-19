import { Calculator, Wallet } from "lucide-react";
import {
  ARQUEO_CONFIG,
  BILLETES,
  DEPOSITOS_ARQUEO,
  MONEDAS,
  arqueoInicial,
  calcularArqueo,
  dinero,
  fechaCorta,
  partesComprobantes,
  sumarComprobantes,
  totalAnulaciones,
  totalDepositos,
  type Arqueo,
  type ArqueoTipo,
} from "@/lib/formatos";
import { AnexosImagenes, Celda, EditorFormato, Encabezado, LineaDato, nombreArchivo, useBorrador } from "./hoja";
import { useAnexosRegistrables } from "./registro-ctx";

const denom = (v: number) => (v >= 1 ? String(v) : v.toFixed(2));

/** Arqueo de caja (ARQUEO.xlsx) y de caja menuda (caja_menuda.xlsx), con fotos de comprobantes anexas. */
export function ArqueoEditor({ tipo, onVolver }: { tipo: ArqueoTipo; onVolver: () => void }) {
  const c = ARQUEO_CONFIG[tipo];
  const clave = `gbd_formato_arqueo_${tipo}`;
  const [a, setA, reiniciar] = useBorrador<Arqueo>(clave, () => arqueoInicial(tipo));
  const [anexos, setAnexos] = useAnexosRegistrables(clave);
  const r = calcularArqueo(a);
  const set = <K extends keyof Arqueo>(k: K, v: Arqueo[K]) => setA((d) => ({ ...d, [k]: v }));
  const setLista = (k: "billetes" | "monedas" | "otros", i: number, v: string) =>
    setA((d) => ({ ...d, [k]: d[k].map((x, j) => (j === i ? v : x)) }));

  return (
    <EditorFormato
      titulo={c.titulo}
      icono={tipo === "caja" ? Calculator : Wallet}
      orientacion="portrait"
      archivo={nombreArchivo(tipo === "caja" ? "arqueo-de-caja" : "arqueo-caja-menuda", a.fecha)}
      ayuda="Escribe las unidades de cada billete y moneda; los totales, la resta del fondo y la diferencia se calculan solos. En BAC, cheques, Yappy, ACH, anulación, comprobantes y depósitos puedes sumar varios montos escribiendo +10+15+20. Abajo puedes anexar las fotos de los comprobantes que llegan por WhatsApp."
      onVolver={onVolver}
      onReiniciar={() => {
        reiniciar();
        setAnexos([]);
      }}
    >
      <Encabezado titulo={c.titulo.toUpperCase()} />
      <div className="fmt-fila">
        <b>Fecha:</b>
        <span className="fmt-w-40">
          <Celda type="date" value={a.fecha} onChange={(v) => set("fecha", v)} mostrar={fechaCorta(a.fecha)} label="Fecha" />
        </span>
      </div>
      <table className="fmt-tabla fmt-arqueo fmt-compacta">
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "26%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Billetes</th>
            <th>Unidades</th>
            <th />
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {BILLETES.map((v, i) => (
            <tr key={`b${v}`}>
              <td className="c">{denom(v)}</td>
              <td>
                <Celda numero align="center" value={a.billetes[i] ?? ""} onChange={(x) => setLista("billetes", i, x)} label={`Billetes de ${v}`} placeholder="0" mostrar={a.billetes[i] || "0"} />
              </td>
              <td />
              <td className="r">{dinero(r.lineasBilletes[i])}</td>
            </tr>
          ))}
          <tr className="fmt-sub">
            <td colSpan={2} />
            <td className="r">B/.</td>
            <td className="r">{dinero(r.totalBilletes)}</td>
          </tr>
          <tr>
            <th colSpan={4} className="l">Monedas</th>
          </tr>
          {MONEDAS.map((v, i) => (
            <tr key={`m${v}`}>
              <td className="c">{denom(v)}</td>
              <td>
                <Celda numero align="center" value={a.monedas[i] ?? ""} onChange={(x) => setLista("monedas", i, x)} label={`Monedas de ${v}`} placeholder="0" mostrar={a.monedas[i] || "0"} />
              </td>
              <td />
              <td className="r">{dinero(r.lineasMonedas[i])}</td>
            </tr>
          ))}
          <tr className="fmt-sub">
            <td colSpan={2} />
            <td className="r">B/.</td>
            <td className="r">{dinero(r.totalMonedas)}</td>
          </tr>
          <tr className="fmt-total">
            <td colSpan={2}>Total de Efectivo</td>
            <td className="r">B/.</td>
            <td className="r">{dinero(r.efectivo)}</td>
          </tr>
          {c.otros.map((label, i) => {
            const valor = a.otros[i] ?? "";
            const partes = partesComprobantes(valor);
            const total = sumarComprobantes(valor);
            return (
              <tr key={label}>
                <td colSpan={3}>
                  {label}
                  {partes.length > 1 && (
                    <span className="fmt-detalle">
                      {" "}({partes.map((n, j) => (j === 0 ? dinero(n) : n < 0 ? ` − ${dinero(-n)}` : ` + ${dinero(n)}`)).join("")})
                    </span>
                  )}
                </td>
                <td>
                  <Celda
                    numero
                    suma
                    align="right"
                    value={valor}
                    onChange={(x) => setLista("otros", i, x)}
                    label={`${label} (puedes sumar: +10+15+20)`}
                    placeholder="+0.00"
                    mostrar={dinero(total)}
                  />
                  {partes.length > 1 && <div className="fmt-noprint fmt-suma">= {dinero(total)}</div>}
                </td>
              </tr>
            );
          })}
          <tr className="fmt-total">
            <td colSpan={2}>Total de dinero</td>
            <td className="r">B/.</td>
            <td className="r">{dinero(r.totalDinero)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Menos Fondo de Cambio</td>
            <td>
              <Celda numero align="right" value={a.fondo} onChange={(x) => set("fondo", x)} label="Fondo de cambio" mostrar={dinero(Number(a.fondo.replace(/,/g, "")) || 0)} />
            </td>
          </tr>
          <tr className="fmt-total">
            <td colSpan={3}>{c.totalLabel}</td>
            <td className="r">{dinero(r.totalIngreso)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Total en recibos / Facturas</td>
            <td>
              <Celda numero align="right" value={a.recibos} onChange={(x) => set("recibos", x)} label="Total en recibos o facturas" placeholder="0.00" mostrar={dinero(Number(a.recibos.replace(/,/g, "")) || 0)} />
            </td>
          </tr>
          <tr className="fmt-total">
            <td>Diferencia:</td>
            <td colSpan={2} className={r.estado === "Faltante" ? "fmt-alerta c" : "c"}>
              {r.estado}
            </td>
            <td className="r">{dinero(r.diferencia)}</td>
          </tr>
        </tbody>
      </table>
      {c.declaracion && (
        <p className="fmt-nota">Declaro que el dinero fue contado en mi presencia y me fue devuelto intacto.</p>
      )}
      {c.depositos && <DepositosYAnulaciones a={a} set={set} />}
      <div className="fmt-obs">
        <b>Observaciones:</b>
        <Celda
          multilinea={3}
          value={a.observaciones ?? ""}
          onChange={(v) => set("observaciones", v)}
          label="Observaciones"
          placeholder="Notas del arqueo (opcional)"
        />
      </div>
      <div className="fmt-firmas">
        <div>
          <LineaDato value={a.firmaNombre} onChange={(v) => set("firmaNombre", v)} pie="" bold />
          <div className="fmt-firma__pie">
            <Celda value={a.firmaCargo} onChange={(v) => set("firmaCargo", v)} align="center" label="Cargo" />
          </div>
        </div>
        {c.revisado && (
          <div>
            <div className="fmt-firma__pie">REVISADO POR:</div>
            <LineaDato value={a.revisadoNombre} onChange={(v) => set("revisadoNombre", v)} pie="" bold />
            <div className="fmt-firma__pie">
              <Celda value={a.revisadoCargo} onChange={(v) => set("revisadoCargo", v)} align="center" label="Cargo de quien revisa" />
            </div>
          </div>
        )}
      </div>
      <AnexosImagenes imagenes={anexos} onChange={setAnexos} />
    </EditorFormato>
  );
}

/** Campo de monto que admite sumas de varios comprobantes. */
function Monto({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const partes = partesComprobantes(value);
  return (
    <>
      <Celda numero suma align="right" value={value} onChange={onChange} label={`${label} (puedes sumar: +10+15+20)`} placeholder="+0.00" mostrar={dinero(sumarComprobantes(value))} />
      {partes.length > 1 && <div className="fmt-noprint fmt-suma">= {dinero(sumarComprobantes(value))}</div>}
    </>
  );
}

/** Depósitos para realizar y anulaciones/devoluciones, antes de las firmas. */
function DepositosYAnulaciones({ a, set }: { a: Arqueo; set: <K extends keyof Arqueo>(k: K, v: Arqueo[K]) => void }) {
  return (
    <div className="fmt-arqueo-extra">
      <table className="fmt-tabla fmt-compacta">
        <colgroup>
          <col style={{ width: "66%" }} />
          <col style={{ width: "34%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="l">Depósitos para realizar</th>
            <th>Monto B/.</th>
          </tr>
        </thead>
        <tbody>
          {DEPOSITOS_ARQUEO.map((d, i) => (
            <tr key={d.campo}>
              <td>
                {i + 1}. {d.label}
              </td>
              <td>
                <Monto value={a[d.campo]} onChange={(v) => set(d.campo, v)} label={d.label} />
              </td>
            </tr>
          ))}
          <tr className="fmt-total">
            <td>Total a depositar</td>
            <td className="r">{dinero(totalDepositos(a))}</td>
          </tr>
        </tbody>
      </table>
      <table className="fmt-tabla fmt-compacta">
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "36%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="l">Anulaciones y devoluciones</th>
            <th>Número</th>
            <th>Monto B/.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Devolución</td>
            <td>
              <Celda value={a.devolucionFactura} onChange={(v) => set("devolucionFactura", v)} label="Número de factura de la devolución" placeholder="Nº de factura" align="center" />
            </td>
            <td>
              <Monto value={a.devolucionMonto} onChange={(v) => set("devolucionMonto", v)} label="Monto de la devolución" />
            </td>
          </tr>
          <tr>
            <td>2. Anulación</td>
            <td>
              <Celda value={a.anulacionRecibo} onChange={(v) => set("anulacionRecibo", v)} label="Número de recibo de la anulación" placeholder="Nº de recibo" align="center" />
            </td>
            <td>
              <Monto value={a.anulacionMonto} onChange={(v) => set("anulacionMonto", v)} label="Monto de la anulación" />
            </td>
          </tr>
          <tr className="fmt-total">
            <td colSpan={2}>Total anulaciones y devoluciones</td>
            <td className="r">{dinero(totalAnulaciones(a))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
