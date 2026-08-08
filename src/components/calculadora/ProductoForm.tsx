import { useRef, useState } from "react";
import { Trash2, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import {
  DESC_MAX_ASOCIADO,
  DESC_MAX_TERCERO,
  fmt,
  type CalculoProducto,
  type ProductoInput,
  type TipoCliente,
  esAsociado,
  mesesPromoContado,
} from "@/lib/pricing";


interface Props {
  producto: ProductoInput;
  index: number;
  tipoCliente: TipoCliente;
  calc: CalculoProducto;
  onChange: (id: string, field: keyof ProductoInput, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function ProductoForm({ producto, index, tipoCliente, calc, onChange, onRemove, canRemove }: Props) {
  const [expandido, setExpandido] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImagen = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen debe ser menor a 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(producto.id, "imagen", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E4DDC9] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            value={producto.nombre}
            onChange={(e) => onChange(producto.id, "nombre", e.target.value)}
            placeholder={`Producto ${index + 1} (ej. Sofá seccional 3 cuerpos)`}
            className="font-bold text-sm bg-transparent border-b border-transparent focus:border-[#C97B3D] outline-none flex-1 mr-2"
          />
          {canRemove && (
            <button onClick={() => onRemove(producto.id)} className="text-[#B0725A] p-1">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-3 mb-3">
          <div className="shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImagen(e.target.files?.[0] ?? null)}
            />
            {producto.imagen ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E4DDC9]">
                <img src={producto.imagen} alt="Producto" className="w-full h-full object-cover" />
                <button
                  onClick={() => onChange(producto.id, "imagen", "")}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  title="Quitar imagen"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-[#C9BFA0] text-[#8A836C] hover:border-[#C97B3D] hover:text-[#C97B3D] flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
              >
                <ImagePlus size={18} />
                Foto
              </button>
            )}
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide text-[#8A836C] font-bold">Descripción</label>
            <textarea
              value={producto.descripcion || ""}
              onChange={(e) => onChange(producto.id, "descripcion", e.target.value)}
              placeholder="Marca, modelo, medidas, color, etc."
              rows={3}
              maxLength={400}
              className="w-full mt-0.5 border border-[#E4DDC9] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#C97B3D] resize-none"
            />
          </div>
        </div>


        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Precio proveedor (editable)"
            value={producto.precioProveedor}
            onChange={(v) => onChange(producto.id, "precioProveedor", v)}
          />
          <Field
            label="Precio etiqueta (editable)"
            value={producto.precioEtiqueta}
            onChange={(v) => onChange(producto.id, "precioEtiqueta", v)}
            hint="Si se llena, ignora precio proveedor + margen"
          />
          <Field
            label="Costo de flete (editable)"
            value={producto.flete}
            onChange={(v) => onChange(producto.id, "flete", v)}
          />
          <Field
            label="Costo de instalación (editable)"
            value={producto.instalacion}
            onChange={(v) => onChange(producto.id, "instalacion", v)}
          />
        </div>

        <div className="mt-3 flex items-center justify-between bg-[#F5F1E8] rounded-lg px-3 py-2.5">
          <span className="text-xs text-[#6B6552] font-bold">Precio de venta a contado</span>
          <span className="font-bold text-[#1F3A38]">{fmt(calc.precioContado)}</span>
        </div>

        <button
          onClick={() => setExpandido((e) => !e)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-[#8A836C] py-1"
        >
          {expandido ? "Ocultar detalle interno" : "Ver detalle interno"}
          {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

      </div>

      {expandido && (
        <div className="bg-[#FBF9F3] border-t border-[#E4DDC9] p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Row label="Margen aplicado" value="Fijo interno (no visible al cliente)" mono />
            <Row label="Precio sin ITBMS" value={fmt(calc.preSinItbms)} mono />
            <Row label="Monto ITBMS" value={fmt(calc.itbmsMonto)} mono />
          </div>

          <div className="border-t border-[#E4DDC9] pt-3">
            <p className="text-xs font-bold text-[#6B6552] mb-1.5">Descuento al contado</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={esAsociado(tipoCliente) ? DESC_MAX_ASOCIADO : DESC_MAX_TERCERO}
                step={0.005}
                value={esAsociado(tipoCliente) ? producto.descAsociadoPct : producto.descTerceroPct}
                onChange={(e) =>
                  onChange(
                    producto.id,
                    esAsociado(tipoCliente) ? "descAsociadoPct" : "descTerceroPct",
                    Number(e.target.value)
                  )
                }
                className="flex-1"
              />
              <span className="text-xs font-bold w-24 text-right">
                -{fmt(
                  calc.precioContado *
                    (esAsociado(tipoCliente) ? calc.descAsociadoPct : calc.descTerceroPct)
                )}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <Row
                label="Precio promocional a pagar"
                value={fmt(esAsociado(tipoCliente) ? calc.promoAsociado : calc.promoTercero)}
                mono
              />
              {esAsociado(tipoCliente) && (
                <Row label="Monto a facturar (sin ITBMS)" value={fmt(calc.facturarAsociado)} mono />
              )}
            </div>
          </div>

          <div className="border-t border-[#E4DDC9] pt-3">
            <p className="text-xs font-bold text-[#6B6552] mb-1.5">
              Precio de crédito {esAsociado(tipoCliente) ? "asociado" : "tercero"}
            </p>
            <Row
              label="Precio de crédito"
              value={fmt(esAsociado(tipoCliente) ? calc.precioCreditoAsociado : calc.precioCreditoTercero)}
              mono
            />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {(esAsociado(tipoCliente) ? calc.planAsociado : calc.planTercero).map((row) => (
                <div key={row.meses} className="bg-white border border-[#E4DDC9] rounded-md px-1.5 py-1.5 text-center">
                  <p className="text-[9px] text-[#8A836C]">{row.meses}m</p>
                  <p className="text-[11px] font-bold">{fmt(row.cuotaMensual)}</p>
                </div>
              ))}
            </div>
          </div>


          {esAsociado(tipoCliente) && (
            <div className="border-t border-[#E4DDC9] pt-3">
              <p className="text-xs font-bold text-[#6B6552] mb-1">{mesesPromoContado(tipoCliente)} meses al precio de etiqueta ({fmt(calc.precioContado)})</p>
              <p className="text-[10px] text-[#8A836C] mb-1.5">Solo {tipoCliente === "colaborador" ? "colaboradores GBD" : "asociados"} con capacidad comprobada</p>
              <div className="flex gap-4 text-xs">
                <Row label="Abono inicial" value={fmt(calc.precioContado / mesesPromoContado(tipoCliente))} mono />
                <Row label="Letra quincenal" value={fmt(calc.precioContado / mesesPromoContado(tipoCliente) / 2)} mono />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-[#8A836C] font-bold">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full mt-0.5 border border-[#E4DDC9] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#C97B3D]"
      />
      {hint && <p className="text-[9px] text-[#B0A98C] mt-0.5">{hint}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#8A836C]">{label}</span>
      <span className={`font-bold text-[#26261F] ${mono ? "tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}
