import { useMemo, useState } from "react";
import { Plus, Calculator, Users, UserCheck, Eye, EyeOff, AlertTriangle, X, User, BadgeCheck } from "lucide-react";
import {
  calcularProducto,
  calcularTotales,
  clienteVacio,
  fmt,
  nuevoProducto,
  PLAZOS,
  type CalculadoProducto,
  type CapacidadInfo,
  type ClienteInfo,
  type ProductoInput,
  type TipoCliente,
  esAsociado,
} from "@/lib/pricing-gbd";
import { Header } from "@/components/Header";
import { ProductoForm } from "@/components/ProductoForm";
import { VistaCliente } from "@/components/VistaCliente";
import { ActionBar } from "@/components/ActionBar";
import { EnlaceGeneradorCard } from "@/components/EnlaceGeneradorCard";


export function AsesorPage() {
  const [vista, setVista] = useState<"asesor" | "cliente">("asesor");
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("asociado");
  const [productos, setProductos] = useState<ProductoInput[]>([nuevoProducto()]);
  const [plazoElegido, setPlazoElegido] = useState(12);
  const [modalCapacidad, setModalCapacidad] = useState(false);
  const [ingreso, setIngreso] = useState("");
  const [deudaActual, setDeudaActual] = useState("");
  const [cliente, setCliente] = useState<ClienteInfo>(clienteVacio());
  const updateCliente = (field: keyof ClienteInfo, value: string) =>
    setCliente((c) => ({ ...c, [field]: value }));

  const calculados: CalculadoProducto[] = useMemo(
    () => productos.map((p) => ({ ...p, calc: calcularProducto(p) })),
    [productos]
  );

  const totales = useMemo(() => calcularTotales(calculados, tipoCliente), [calculados, tipoCliente]);

  const updateProducto = (id: string, field: keyof ProductoInput, value: string | number) => {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removeProducto = (id: string) => {
    setProductos((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };
  const addProducto = () => setProductos((prev) => [...prev, nuevoProducto()]);

  const cuotaElegida = totales.planTotal.find((x) => x.meses === plazoElegido);

  const capacidad = useMemo(() => {
    const ing = Number(ingreso) || 0;
    const deuda = Number(deudaActual) || 0;
    const tope = esAsociado(tipoCliente) ? 0.35 : 0.25;
    const limiteCuota = ing * tope - deuda;
    const cuotaProp = cuotaElegida ? cuotaElegida.cuotaMensual : 0;
    return { tope, limiteCuota, cuotaProp, aprueba: limiteCuota >= cuotaProp && ing > 0 };
  }, [ingreso, deudaActual, tipoCliente, cuotaElegida]);

  const capacidadInfo: CapacidadInfo | undefined = useMemo(() => {
    const ing = Number(ingreso) || 0;
    if (ing <= 0) return undefined;
    return {
      ingreso: ing,
      deudaActual: Number(deudaActual) || 0,
      plazoMeses: plazoElegido,
      cuotaPropuesta: capacidad.cuotaProp,
      topePct: capacidad.tope,
      limiteCuota: capacidad.limiteCuota,
      aprueba: capacidad.aprueba,
    };
  }, [ingreso, deudaActual, plazoElegido, capacidad]);


  const contadoTotal = esAsociado(tipoCliente) ? totales.promoAsociado : totales.promoTercero;
  const creditoTotal = esAsociado(tipoCliente) ? totales.precioCreditoAsociado : totales.precioCreditoTercero;

  return (
    <div className="min-h-screen bg-[#F4F9FF] text-[#071123]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header>
        <button
          onClick={() => setVista(vista === "asesor" ? "cliente" : "asesor")}
          className="flex items-center gap-2 bg-[#1F6DD8] hover:bg-[#0054BD] transition-colors px-4 py-2.5 rounded-full text-sm font-bold shadow-md"
        >
          {vista === "asesor" ? <Eye size={16} /> : <EyeOff size={16} />}
          {vista === "asesor" ? "Vista Asesor" : "Vista Cliente"}
        </button>
      </Header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-[#DBE2EB] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#535E6F] mb-2">Tipo de cliente</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTipoCliente("asociado")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                tipoCliente === "asociado" ? "bg-[#1F6DD8] text-white border-[#1F6DD8]" : "bg-white text-[#535E6F] border-[#DBE2EB]"
              }`}
            >
              <UserCheck size={16} /> Asociado
            </button>
            <button
              onClick={() => setTipoCliente("colaborador")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                tipoCliente === "colaborador" ? "bg-[#1F6DD8] text-white border-[#1F6DD8]" : "bg-white text-[#535E6F] border-[#DBE2EB]"
              }`}
            >
              <BadgeCheck size={16} /> Colaborador GBD
            </button>
            <button
              onClick={() => setTipoCliente("tercero")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                tipoCliente === "tercero" ? "bg-[#1F6DD8] text-white border-[#1F6DD8]" : "bg-white text-[#535E6F] border-[#DBE2EB]"
              }`}
            >
              <Users size={16} /> No asociado (tercero)
            </button>
          </div>
        </div>

        {vista === "asesor" && (
          <>
            <div className="bg-white rounded-xl border border-[#DBE2EB] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#535E6F] mb-2 flex items-center gap-1.5">
                <User size={14} /> Datos del cliente
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ClienteField label="Nombre completo" value={cliente.nombre} onChange={(v) => updateCliente("nombre", v)} />
                <ClienteField label="Cédula" value={cliente.cedula} onChange={(v) => updateCliente("cedula", v)} />
                <ClienteField label="Teléfono (WhatsApp)" value={cliente.telefono} onChange={(v) => updateCliente("telefono", v)} placeholder="6xxx-xxxx" inputMode="tel" />
                <ClienteField label="Correo electrónico" value={cliente.correo} onChange={(v) => updateCliente("correo", v)} inputMode="email" />
                <div className="sm:col-span-2">
                  <ClienteField label="Dirección" value={cliente.direccion} onChange={(v) => updateCliente("direccion", v)} />
                </div>
              </div>
              <p className="text-[10px] text-[#8793A5] mt-2">
                Si escribes el teléfono, el botón de WhatsApp abrirá directamente el chat de ese cliente.
              </p>
            </div>

            <div className="space-y-4">

              {productos.map((p, idx) => (
                <ProductoForm
                  key={p.id}
                  producto={p}
                  index={idx}
                  tipoCliente={tipoCliente}
                  calc={calculados[idx].calc}
                  onChange={updateProducto}
                  onRemove={removeProducto}
                  canRemove={productos.length > 1}
                />
              ))}
              <button
                onClick={addProducto}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#B6C2D4] text-[#535E6F] hover:border-[#1F6DD8] hover:text-[#1F6DD8] transition-colors text-sm font-bold"
              >
                <Plus size={18} /> Agregar otro producto
              </button>
            </div>

            <div className="bg-[#002362] text-[#F4F9FF] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wide text-[#B0C6E5] font-bold mb-3">
                Total cotización ({productos.length} producto{productos.length > 1 ? "s" : ""})
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[11px] text-[#B0C6E5]">Precio de contado</p>
                  <p className="text-lg font-bold">{fmt(totales.precioContado)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#B0C6E5]">Contado con descuento aplicado</p>
                  <p className="text-lg font-bold">{fmt(contadoTotal)}</p>
                </div>
              </div>

              <p className="text-[11px] text-[#B0C6E5] mb-2">
                Plan de cuotas — precio de crédito:{" "}
                <span className="font-bold text-[#F4F9FF]">{fmt(creditoTotal)}</span>
              </p>

              <div className="grid grid-cols-4 gap-2">
                {totales.planTotal.map((row) => (
                  <div key={row.meses} className="bg-[#003581] rounded-lg px-2 py-2 text-center">
                    <p className="text-[10px] text-[#B0C6E5]">{row.meses} meses</p>
                    <p className="text-sm font-bold">{fmt(row.cuotaMensual)}</p>
                    <p className="text-[10px] text-[#B0C6E5]">{fmt(row.letraQuincenal)} quinc.</p>
                  </div>
                ))}
              </div>

              {esAsociado(tipoCliente) && (
                <div className="mt-3 rounded-xl overflow-hidden border-2 border-[#1F6DD8]">
                  <div className="bg-[#1F6DD8] text-white px-3 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-widest font-bold">{tipoCliente === "colaborador" ? "¡Promoción para colaboradores GBD!" : "¡Promoción para asociados!"}</p>
                    <p className="text-sm font-bold">{totales.mesesPromo} meses a precio de contado</p>
                  </div>
                  <div className="bg-[#E3EFFF] px-3 py-3 text-center text-[#002362]">
                    <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Precio de etiqueta</p>
                    <p className="text-xl font-bold mb-2">{fmt(totales.precioContado)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg border border-[#BFD6F5] px-2 py-1.5">
                        <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Abono inicial</p>
                        <p className="text-sm font-bold">{fmt(totales.cuotaPromoContado)}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-[#BFD6F5] px-2 py-1.5">
                        <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Quincenal</p>
                        <p className="text-sm font-bold">{fmt(totales.cuotaPromoContado / 2)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#0C4C9E] mt-2">Sujeto a capacidad comprobada</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setModalCapacidad(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1F6DD8] hover:bg-[#0054BD] text-white font-bold transition-colors"
            >
              <Calculator size={18} /> Evaluar capacidad de pago
            </button>

            <EnlaceGeneradorCard tipoCliente={tipoCliente} calculados={calculados} modo="ver" cliente={cliente} capacidad={capacidadInfo} />
            <EnlaceGeneradorCard tipoCliente={tipoCliente} calculados={calculados} modo="imprimir" cliente={cliente} capacidad={capacidadInfo} />

            <ActionBar
              tipoCliente={tipoCliente}
              calculados={calculados}
              contadoTotal={contadoTotal}
              creditoTotal={creditoTotal}
              plazoElegido={plazoElegido}
              cuota={cuotaElegida}
              planTotal={totales.planTotal}
              mostrarDescargaImagen
              cliente={cliente}
              capacidad={capacidadInfo}
              promo={esAsociado(tipoCliente) ? { precioEtiqueta: totales.precioContado, cuota3m: totales.cuotaPromoContado, meses: totales.mesesPromo } : undefined}
            />


          </>
        )}

        {vista === "cliente" && (
          <>
            <VistaCliente
              calculados={calculados}
              totales={totales}
              tipoCliente={tipoCliente}
              plazoElegido={plazoElegido}
              setPlazoElegido={setPlazoElegido}
              cliente={cliente}
              capacidad={capacidadInfo}
            />
            <ActionBar
              tipoCliente={tipoCliente}
              calculados={calculados}
              contadoTotal={contadoTotal}
              creditoTotal={creditoTotal}
              plazoElegido={plazoElegido}
              cuota={cuotaElegida}
              planTotal={totales.planTotal}
              mostrarDescargaImagen
              cliente={cliente}
              capacidad={capacidadInfo}
              promo={esAsociado(tipoCliente) ? { precioEtiqueta: totales.precioContado, cuota3m: totales.cuotaPromoContado, meses: totales.mesesPromo } : undefined}
            />

          </>
        )}

      </div>

      {modalCapacidad && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Evaluar capacidad de pago</h3>
              <button onClick={() => setModalCapacidad(false)} className="text-[#68758A]">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-[#68758A] leading-relaxed bg-[#F4F9FF] rounded-lg p-3">
              <AlertTriangle size={13} className="inline mr-1 -mt-0.5" />
              Este cálculo aplica el tope legal panameño de endeudamiento vigente. Confírmalo contra política de la
              cooperativa antes de usarlo como aprobación final.
            </p>

            <div>
              <label className="text-xs font-bold text-[#535E6F]">Ingreso mensual del cliente (B/.)</label>
              <input
                type="number"
                value={ingreso}
                onChange={(e) => setIngreso(e.target.value)}
                className="w-full mt-1 border border-[#DBE2EB] rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535E6F]">Deuda mensual actual comprometida (B/.)</label>
              <input
                type="number"
                value={deudaActual}
                onChange={(e) => setDeudaActual(e.target.value)}
                className="w-full mt-1 border border-[#DBE2EB] rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535E6F]">Plazo a evaluar</label>
              <select
                value={plazoElegido}
                onChange={(e) => setPlazoElegido(Number(e.target.value))}
                className="w-full mt-1 border border-[#DBE2EB] rounded-lg px-3 py-2 text-sm"
              >
                {PLAZOS.map((m) => (
                  <option key={m} value={m}>
                    {m} meses
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg p-3 bg-[#F4F9FF] space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#535E6F]">Tope legal</span>
                <span className="font-bold">{fmt((Number(ingreso) || 0) * capacidad.tope)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#535E6F]">Disponible tras deuda actual</span>
                <span className="font-bold">{fmt(capacidad.limiteCuota)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#535E6F]">Cuota propuesta ({plazoElegido} meses)</span>
                <span className="font-bold">{fmt(capacidad.cuotaProp)}</span>
              </div>
            </div>

            <div
              className={`rounded-lg p-3 text-center font-bold text-sm ${
                capacidad.aprueba ? "bg-[#E4EEE0] text-[#2F5D3A]" : "bg-[#F5E1DA] text-[#9C4A2E]"
              }`}
            >
              {ingreso === ""
                ? "Ingresa el ingreso mensual para evaluar"
                : capacidad.aprueba
                ? "Dentro del límite de capacidad"
                : "Excede el límite legal de endeudamiento"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClienteField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "tel" | "email";
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-[#68758A] font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full mt-0.5 border border-[#DBE2EB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1F6DD8]"
      />
    </div>
  );
}

