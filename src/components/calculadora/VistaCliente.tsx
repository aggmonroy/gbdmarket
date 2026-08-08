import { Clock } from "lucide-react";
import {
  fmt,
  PLAZOS,
  type CalculadoProducto,
  type CapacidadInfo,
  type ClienteInfo,
  type Totales,
  type TipoCliente,
  esAsociado,
  etiquetaTipoCliente,
} from "@/lib/pricing-gbd";

interface Props {
  calculados: CalculadoProducto[];
  totales: Totales;
  tipoCliente: TipoCliente;
  plazoElegido: number;
  setPlazoElegido: (m: number) => void;
  cliente?: ClienteInfo;
  capacidad?: CapacidadInfo;
}

export function VistaCliente({ calculados, totales, tipoCliente, plazoElegido, setPlazoElegido, cliente, capacidad }: Props) {
  const cuota = totales.planTotal.find((r) => r.meses === plazoElegido);
  const creditoTotal = esAsociado(tipoCliente) ? totales.precioCreditoAsociado : totales.precioCreditoTercero;
  const contadoTotal = esAsociado(tipoCliente) ? totales.promoAsociado : totales.promoTercero;
  const tieneCliente = !!cliente && Object.values(cliente).some((v) => (v ?? "").toString().trim() !== "");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-2 bg-[#E3EFFF] border border-[#BFD6F5] text-[#0C4C9E] rounded-full py-2 px-4 text-xs font-bold">
        <Clock size={14} />
        Cotización válida por 30 días o hasta agotar existencias
      </div>

      {tieneCliente && cliente && (
        <div className="bg-white rounded-xl border border-[#DBE2EB] p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs uppercase tracking-wide text-[#68758A] font-bold">Datos del cliente</p>
            <span className="text-[10px] uppercase font-bold rounded-full px-2.5 py-1 bg-[#F4F9FF] text-[#002362] border border-[#DBE2EB]">
              {etiquetaTipoCliente(tipoCliente)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {cliente.nombre && <ClienteLine label="Nombre" value={cliente.nombre} />}
            {cliente.cedula && <ClienteLine label="Cédula" value={cliente.cedula} />}
            {cliente.telefono && <ClienteLine label="Teléfono" value={cliente.telefono} />}
            {cliente.correo && <ClienteLine label="Correo" value={cliente.correo} />}
            {cliente.direccion && (
              <div className="sm:col-span-2">
                <ClienteLine label="Dirección" value={cliente.direccion} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#DBE2EB] p-5">
        <p className="text-xs uppercase tracking-wide text-[#68758A] font-bold mb-3">Productos cotizados</p>
        <div className="space-y-4">
          {calculados.map(({ nombre, imagen, descripcion, calc }, i) => {
            const precioFinal = esAsociado(tipoCliente) ? calc.promoAsociado : calc.promoTercero;
            const precioCredito = esAsociado(tipoCliente) ? calc.precioCreditoAsociado : calc.precioCreditoTercero;
            const hayDescuento = precioFinal < calc.precioContado - 0.005;
            return (
              <div key={i} className="border border-[#E3EFFF] rounded-lg p-3">
                <div className="flex gap-3 mb-2">
                  {imagen && (
                    <img
                      src={imagen}
                      alt={nombre || `Producto ${i + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-[#DBE2EB] shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#002362]">{nombre || `Producto ${i + 1}`}</p>
                    {descripcion && (
                      <p className="text-[11px] text-[#535E6F] mt-0.5 whitespace-pre-wrap">{descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F4F9FF] rounded-lg px-2.5 py-2">
                    <p className="text-[10px] uppercase text-[#68758A] font-bold">Contado</p>
                    {hayDescuento && <p className="text-[10px] text-[#8793A5] line-through">{fmt(calc.precioContado)}</p>}
                    <p className="text-sm font-bold text-[#002362]">{fmt(precioFinal)}</p>
                  </div>
                  <div className="bg-[#F4F9FF] rounded-lg px-2.5 py-2">
                    <p className="text-[10px] uppercase text-[#68758A] font-bold">A crédito</p>
                    <p className="text-sm font-bold text-[#002362]">{fmt(precioCredito)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#002362] text-white rounded-2xl p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-[#B0C6E5] font-bold mb-1">Total pago al contado</p>
        <p className="text-3xl font-bold">{fmt(contadoTotal)}</p>
      </div>

      <div className="bg-white rounded-xl border border-[#DBE2EB] p-5">
        <p className="text-xs uppercase tracking-wide text-[#68758A] font-bold mb-1">Plazos disponibles a crédito</p>
        <p className="text-[10px] text-[#8793A5] mb-3">
          Total a crédito: {fmt(creditoTotal)} · toca un plazo para ver el desglose por producto
        </p>

        <div className="space-y-1.5 mb-1">
          {totales.planTotal.map((row) => {
            const activo = row.meses === plazoElegido;
            return (
              <button
                key={row.meses}
                onClick={() => setPlazoElegido(row.meses)}
                className={`w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 border transition-colors ${
                  activo ? "bg-[#002362] border-[#002362] text-white" : "bg-[#F4F9FF] border-[#E3EFFF] text-[#002362] hover:border-[#1F6DD8]"
                }`}
              >
                <span className="text-sm font-bold">{row.meses} meses</span>
                <span className="text-right">
                  <span className="block text-sm font-bold">{fmt(row.cuotaMensual)}/mes</span>
                  <span className={`block text-[10px] font-bold ${activo ? "text-[#B0C6E5]" : "text-[#68758A]"}`}>
                    {fmt(row.letraQuincenal)} quincenal
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {calculados.length > 1 && cuota && (
          <div className="mt-4 pt-4 border-t border-[#E3EFFF]">
            <p className="text-[11px] uppercase text-[#68758A] font-bold mb-2">Desglose por producto — {plazoElegido} meses</p>
            <div className="space-y-1.5">
              {calculados.map(({ nombre, calc }, i) => {
                const precioCredito = esAsociado(tipoCliente) ? calc.precioCreditoAsociado : calc.precioCreditoTercero;
                const cuotaProd = precioCredito / plazoElegido;
                return (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[#E3EFFF] pb-1.5 last:border-0">
                    <span className="text-[#535E6F]">{nombre || `Producto ${i + 1}`}</span>
                    <span className="font-bold text-[#002362]">{fmt(cuotaProd)} / mes</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {esAsociado(tipoCliente) && (
          <div className="mt-4 rounded-2xl overflow-hidden border-2 border-[#1F6DD8] shadow-sm">
            <div className="bg-[#1F6DD8] text-white px-4 py-2 text-center">
              <p className="text-[11px] uppercase tracking-widest font-bold">{tipoCliente === "colaborador" ? "¡Promoción exclusiva para colaboradores GBD!" : "¡Promoción exclusiva para asociados!"}</p>
              <p className="text-base font-bold">{totales.mesesPromo} meses a precio de contado</p>
            </div>
            <div className="bg-[#E3EFFF] px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[#0C4C9E] font-bold">Precio de etiqueta</p>
              <p className="text-2xl font-bold text-[#002362] mb-3">{fmt(totales.precioContado)}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-[#BFD6F5] px-2 py-2">
                  <p className="text-[10px] uppercase text-[#0C4C9E] font-bold">Abono inicial</p>
                  <p className="text-base font-bold text-[#002362]">{fmt(totales.cuotaPromoContado)}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#BFD6F5] px-2 py-2">
                  <p className="text-[10px] uppercase text-[#0C4C9E] font-bold">Quincenal</p>
                  <p className="text-base font-bold text-[#002362]">{fmt(totales.cuotaPromoContado / 2)}</p>
                </div>
              </div>
              <p className="text-[10px] text-[#0C4C9E] mt-2">Sujeto a capacidad comprobada</p>
            </div>
          </div>
        )}
      </div>

      {capacidad && (
        <div
          className={`rounded-xl border p-5 ${
            capacidad.aprueba ? "border-[#B7D5B0] bg-[#E4EEE0]" : "border-[#E9C4B4] bg-[#FBEAE4]"
          }`}
        >
          <p className="text-xs uppercase font-bold text-[#535E6F] mb-2">Evaluación de capacidad de pago</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <ClienteLine label="Ingreso mensual" value={fmt(capacidad.ingreso)} />
            <ClienteLine label="Deuda actual" value={fmt(capacidad.deudaActual)} />
            <ClienteLine label="Tope legal" value={fmt(capacidad.ingreso * capacidad.topePct)} />
            <ClienteLine label="Disponible tras deuda" value={fmt(capacidad.limiteCuota)} />
            <ClienteLine label={`Cuota propuesta (${capacidad.plazoMeses} meses)`} value={fmt(capacidad.cuotaPropuesta)} />
            <ClienteLine label="Resultado" value={capacidad.aprueba ? "Dentro del límite" : "Excede el límite legal"} />
          </div>
        </div>
      )}
    </div>
  );
}

function ClienteLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#68758A]">{label}</span>
      <span className="font-bold text-[#002362] text-right break-words">{value}</span>
    </div>
  );
}

export { PLAZOS };
