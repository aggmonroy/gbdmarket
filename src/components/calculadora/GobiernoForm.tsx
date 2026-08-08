import { useRef } from "react";
import { Trash2, ImagePlus, X } from "lucide-react";
import { DESC_MAX_GOBIERNO, fmt, type LineaGobierno, type ProductoInput } from "@/lib/pricing-gbd";

interface Props {
  producto: ProductoInput;
  index: number;
  linea: LineaGobierno;
  onChange: (id: string, field: keyof ProductoInput, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function GobiernoForm({ producto, index, linea, onChange, onRemove, canRemove }: Props) {
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
    <div className="bg-white rounded-xl border border-[#DBE2EB] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase font-bold text-[#68758A]">Renglón {index + 1}</p>
        {canRemove && (
          <button onClick={() => onRemove(producto.id)} className="text-[#0054BD] p-1" title="Quitar renglón">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImagen(e.target.files?.[0] ?? null)}
          />
          {producto.imagen ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#DBE2EB]">
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
              className="w-20 h-20 rounded-lg border-2 border-dashed border-[#B6C2D4] text-[#68758A] hover:border-[#1F6DD8] hover:text-[#1F6DD8] flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
            >
              <ImagePlus size={18} />
              Foto
            </button>
          )}
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Text
              label="Código del producto (columna Referencia)"
              value={producto.referencia || ""}
              onChange={(v) => onChange(producto.id, "referencia", v)}
              placeholder="Ej. OLLA-5L / 7501234567890"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wide text-[#68758A] font-bold">
              Descripción del producto (columna Detalle)
            </label>
            <textarea
              value={producto.descripcion || ""}
              onChange={(e) => onChange(producto.id, "descripcion", e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="OLLA 5 LITROS DE ALUMINIO CON TAPA"
              className="w-full mt-0.5 border border-[#DBE2EB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1F6DD8] resize-none"
            />
          </div>
          <Num
            label="Cantidad"
            value={producto.cantidad ?? ""}
            onChange={(v) => onChange(producto.id, "cantidad", v)}
          />
          <Num
            label="Precio unitario (B/.)"
            value={producto.precioUnitario ?? ""}
            onChange={(v) => onChange(producto.id, "precioUnitario", v)}
          />
        </div>
      </div>

      <div className="mt-3 border-t border-[#E3EFFF] pt-3">
        <div className="flex items-center gap-3">
          <label className="text-[10px] uppercase tracking-wide text-[#68758A] font-bold shrink-0">
            Descuento (máx. 10%)
          </label>
          <input
            type="range"
            min={0}
            max={DESC_MAX_GOBIERNO}
            step={0.005}
            value={linea.descPct}
            onChange={(e) => onChange(producto.id, "descGobiernoPct", Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={Number((linea.descPct * 100).toFixed(1))}
            onChange={(e) =>
              onChange(
                producto.id,
                "descGobiernoPct",
                Math.min(Math.max(Number(e.target.value) || 0, 0), 10) / 100
              )
            }
            className="w-20 border border-[#DBE2EB] rounded-lg px-2 py-1 text-sm text-right"
          />
          <span className="text-xs font-bold text-[#535E6F]">%</span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Cell label="Unitario neto" value={fmt(linea.precioUnitario)} />
          <Cell label="Subtotal" value={fmt(linea.subtotal)} />
          <Cell label="ITBMS 7%" value={fmt(linea.itbms)} />
          <Cell label="P. Total" value={fmt(linea.total)} destacado />
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, destacado }: { label: string; value: string; destacado?: boolean }) {
  return (
    <div className={`rounded-lg px-2.5 py-2 ${destacado ? "bg-[#002362] text-white" : "bg-[#F4F9FF]"}`}>
      <p className={`text-[10px] uppercase font-bold ${destacado ? "text-[#B0C6E5]" : "text-[#68758A]"}`}>{label}</p>
      <p className={`text-sm font-bold ${destacado ? "text-white" : "text-[#002362]"}`}>{value}</p>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-[#68758A] font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-0.5 border border-[#DBE2EB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1F6DD8]"
      />
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-[#68758A] font-bold">{label}</label>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full mt-0.5 border border-[#DBE2EB] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1F6DD8]"
      />
    </div>
  );
}
