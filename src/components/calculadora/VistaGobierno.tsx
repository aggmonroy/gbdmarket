import { fmt, type ClienteInfo, type TotalesGobierno } from "@/lib/pricing-gbd";
import logoIcono from "@/assets/calculadora/logo-icono.png";

interface Props {
  totales: TotalesGobierno;
  cliente?: ClienteInfo;
  fecha?: string;
  numero?: string;
  vendedor?: string;
  conEncabezado?: boolean;
}

export function VistaGobierno({
  totales,
  cliente,
  fecha,
  numero,
  vendedor = "Ana Gómez",
  conEncabezado = true,
}: Props) {
  const fechaTexto =
    fecha ??
    new Date().toLocaleDateString("es-PA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="bg-white border border-[#DBE2EB] rounded-xl overflow-hidden text-[#071123]">
      {conEncabezado && (
        <div className="px-5 py-4 border-b border-[#DBE2EB] flex items-center gap-3">
          <img src={logoIcono} alt="GBD" className="h-14 w-14 rounded-lg border border-[#DBE2EB] p-1 shrink-0" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#002362]">
              Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L.
            </p>
            <p className="text-[11px] font-bold text-[#535E6F]">SECCIÓN LÍNEA BLANCA · RUC 1-236-63 DV 20</p>
            <p className="text-[11px] text-[#68758A]">Calle Minsin y Gringa — Las Tablas, Prov. Los Santos</p>
          </div>
        </div>
      )}

      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs">
        <Line label="Fecha" value={fechaTexto} />
        {numero && <Line label="Cotización N°" value={numero} />}
        <Line label="Nombre" value={cliente?.nombre || "—"} />
        <Line label="Teléfono" value={cliente?.telefono || "—"} />
        <Line label="Dirección" value={cliente?.direccion || "—"} />
        <Line label="Condiciones de pago" value={cliente?.condicionesPago || "Contado"} />
        <div className="sm:col-span-2">
          <Line label="Observaciones" value={cliente?.observaciones || "VÁLIDO 30 DÍAS"} />
        </div>
      </div>

      <div className="px-5 pb-5 overflow-x-auto">
        <table className="w-full text-[11px] border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-[#002362] text-white">
              <Th>Imagen</Th>
              <Th>Referencia</Th>
              <Th className="text-left">Detalle</Th>
              <Th>Cant.</Th>
              <Th>P. unitario</Th>
              <Th>Subtotal</Th>
              <Th>ITBMS 7%</Th>
              <Th>P. Total</Th>
            </tr>
          </thead>
          <tbody>
            {totales.lineas.map((l, i) => (
              <tr key={l.id} className={i % 2 ? "bg-[#F4F9FF]" : "bg-white"}>
                <Td className="text-center">
                  {l.imagen ? (
                    <img
                      src={l.imagen}
                      alt={l.detalle || l.referencia}
                      className="w-12 h-12 object-cover rounded border border-[#DBE2EB] mx-auto"
                    />
                  ) : (
                    <span className="text-[#B6C2D4]">—</span>
                  )}
                </Td>
                <Td className="font-bold text-[#002362] whitespace-nowrap">{l.referencia || "—"}</Td>
                <Td className="text-left uppercase">{l.detalle || "—"}</Td>
                <Td className="text-center tabular-nums">{l.cantidad}</Td>
                <Td className="text-right tabular-nums">
                  {l.descPct > 0 && (
                    <span className="block text-[10px] text-[#8793A5] line-through">
                      {l.precioUnitarioBase.toFixed(2)}
                    </span>
                  )}
                  {l.precioUnitario.toFixed(2)}
                </Td>
                <Td className="text-right tabular-nums">{l.subtotal.toFixed(2)}</Td>
                <Td className="text-right tabular-nums">{l.itbms.toFixed(2)}</Td>
                <Td className="text-right font-bold text-[#002362] tabular-nums">{fmt(l.total)}</Td>
              </tr>
            ))}
            <tr className="bg-[#E3EFFF] font-bold text-[#002362]">
              <Td className="text-right" colSpan={5}>
                TOTALES
              </Td>
              <Td className="text-right tabular-nums">{totales.subtotal.toFixed(2)}</Td>
              <Td className="text-right tabular-nums">{totales.itbms.toFixed(2)}</Td>
              <Td className="text-right tabular-nums">{fmt(totales.total)}</Td>
            </tr>
          </tbody>
        </table>

        {totales.descuento > 0 && (
          <p className="text-[11px] text-[#0C4C9E] font-bold mt-2">
            Descuento institucional aplicado: {fmt(totales.descuento)}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="text-[11px] text-[#535E6F]">
            <p className="font-bold text-[#002362]">{vendedor}</p>
            <p>VENDEDOR</p>
            <p>WhatsApp: 6784-1941</p>
          </div>
          <div className="bg-[#002362] text-white rounded-xl px-5 py-3 text-right">
            <p className="text-[10px] uppercase font-bold text-[#B0C6E5]">Total a pagar (contado)</p>
            <p className="text-2xl font-bold">{fmt(totales.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[#68758A] font-bold whitespace-nowrap">{label}:</span>
      <span className="text-[#002362] font-bold break-words">{value}</span>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`border border-[#BFD6F5] px-2 py-1.5 text-center font-bold ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border border-[#DBE2EB] px-2 py-1.5 align-middle ${className}`}>
      {children}
    </td>
  );
}
