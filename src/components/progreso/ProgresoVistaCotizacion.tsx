import membrete from "@/assets/membrete-convenio-progreso.png.asset.json";
import { PUNTO_VENTA_PROGRESO, fmtGP, type ClienteProgreso, type TotalesProgreso } from "@/lib/progreso";

/**
 * Vista imprimible de la cotización de El Progreso: membrete del convenio,
 * datos del punto de venta y el detalle con su propio margen y plazo tope.
 */
export function ProgresoVistaCotizacion({
  numero,
  fecha,
  cliente,
  totales,
  refNode,
  interno = false,
}: {
  numero: string;
  fecha: string;
  cliente: ClienteProgreso;
  totales: TotalesProgreso;
  refNode?: (el: HTMLDivElement | null) => void;
  /** Solo la vista de asesor muestra margen y tope de plazo. */
  interno?: boolean;
}) {
  return (
    <div ref={refNode} className="mx-auto w-full max-w-[820px] bg-white p-6 text-[#1a2433]">
      <header className="border-b-2 border-[#0F7B3E] pb-4 text-center">
        <img src={membrete.url} alt="Convenio comercial Cooperativa GBD y Cooperativa El Progreso" className="mx-auto max-h-28 object-contain" />
        <p className="mt-2 text-[11px] font-semibold text-[#4a5768]">{PUNTO_VENTA_PROGRESO.convenio}</p>
      </header>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 text-xs">
        <div>
          <p className="text-sm font-bold text-[#0F7B3E]">{PUNTO_VENTA_PROGRESO.nombre}</p>
          <p className="italic text-[#4a5768]">{PUNTO_VENTA_PROGRESO.lema}</p>
          <p className="text-[#4a5768]">WhatsApp {PUNTO_VENTA_PROGRESO.whatsappVisible}</p>
          <p className="text-[#4a5768]">{PUNTO_VENTA_PROGRESO.atencion}</p>
        </div>
        <div className="rounded-lg border border-[#CFE3D6] bg-[#F2F9F4] px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#4a5768]">Cotización</p>
          <p className="font-mono text-lg font-bold text-[#0F7B3E]">{numero}</p>
          <p className="text-[11px] text-[#4a5768]">{fecha}</p>
        </div>
      </div>

      {(cliente.nombre || cliente.telefono) && (
        <div className="mt-4 rounded-lg border border-[#E1E7EE] p-3 text-xs">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#68758A]">Cliente</p>
          {cliente.nombre && <p className="font-semibold">{cliente.nombre}</p>}
          {cliente.telefono && <p className="text-[#4a5768]">Teléfono / WhatsApp: {cliente.telefono}</p>}
        </div>
      )}

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#0F7B3E] text-left text-white">
            <th className="p-2">Artículo</th>
            <th className="p-2">Modelo</th>
            <th className="p-2 text-right">Cant.</th>
            <th className="p-2 text-right">Precio</th>
            <th className="p-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {totales.lineas.map((l) => (
            <tr key={l.id} className="border-b border-[#E1E7EE] align-top">
              <td className="p-2">
                <div className="flex gap-2">
                  {l.imagen && (
                    <img src={l.imagen} alt={l.nombre} className="h-12 w-12 shrink-0 rounded border border-[#E1E7EE] object-cover" />
                  )}
                  <div>
                    <p className="font-semibold">{l.nombre || "Artículo"}</p>
                    {l.descripcion && <p className="text-[10px] text-[#68758A]">{l.descripcion}</p>}
                  </div>
                </div>
              </td>
              <td className="p-2">{l.modelo || "—"}</td>
              <td className="p-2 text-right">{l.cantidadNum}</td>
              <td className="p-2 text-right">{fmtGP(l.etiquetaNum)}</td>
              <td className="p-2 text-right font-semibold">{fmtGP(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[#0F7B3E] p-4 text-center text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#CFE3D6]">Total al contado</p>
          <p className="text-2xl font-bold">{fmtGP(totales.totalContado)}</p>
        </div>
        <div className="rounded-lg border-2 border-[#0F7B3E] p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a5768]">Total a crédito</p>
          <p className="text-2xl font-bold text-[#0F7B3E]">{fmtGP(totales.totalCredito)}</p>
          <p className="text-[10px] text-[#68758A]">
            Margen aplicado {totales.margenPct}% · plazo máximo {totales.plazoTope} meses
          </p>
        </div>
      </div>

      {totales.plazos.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#E1E7EE] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#68758A]">Plazos disponibles</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {totales.plazos.map((p) => (
              <div key={p.meses} className="rounded-md bg-[#F2F9F4] px-3 py-2 text-xs">
                <p className="font-bold text-[#0F7B3E]">{p.meses} meses</p>
                <p className="font-semibold">{fmtGP(p.cuotaMensual)} / mes</p>
                <p className="text-[10px] text-[#68758A]">{fmtGP(p.letraQuincenal)} quincenal</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 border-t border-[#E1E7EE] pt-2 text-center text-[10px] text-[#68758A]">
        Cotización emitida por {PUNTO_VENTA_PROGRESO.nombre} como punto de venta aliado. Precios, margen y plazos
        definidos por El Progreso. Válida por 15 días o hasta agotar existencias. Consultas al WhatsApp{" "}
        {PUNTO_VENTA_PROGRESO.whatsappVisible}.
      </p>
    </div>
  );
}
