import { Plus, BadgeCheck, User } from "lucide-react";
import {
  calcularGobierno,
  clienteVacio,
  type ClienteInfo,
  type ProductoInput,
} from "@/lib/pricing-gbd";
import { GobiernoForm } from "@/components/calculadora/GobiernoForm";
import { VistaGobierno } from "@/components/calculadora/VistaGobierno";
import { ActionBar } from "@/components/calculadora/ActionBar";
import { EnlaceGeneradorCard } from "@/components/calculadora/EnlaceGeneradorCard";

interface Props {
  vista: "asesor" | "cliente";
  productos: ProductoInput[];
  cliente: ClienteInfo;
  updateCliente: (field: keyof ClienteInfo, value: string) => void;
  updateProducto: (id: string, field: keyof ProductoInput, value: string | number) => void;
  removeProducto: (id: string) => void;
  addProducto: () => void;
  onFinalizar?: () => void;
  finalizando?: boolean;
  etiquetaFinalizar?: string;
}

export function GobiernoSeccion({
  vista,
  productos,
  cliente,
  updateCliente,
  updateProducto,
  removeProducto,
  addProducto,
  onFinalizar,
  finalizando,
  etiquetaFinalizar = "Finalizar cotización",
}: Props) {
  const totales = calcularGobierno(productos);
  const calculadosVacios: never[] = [];

  const barra = (
    <ActionBar
      tipoCliente="gobierno"
      calculados={calculadosVacios}
      contadoTotal={totales.total}
      creditoTotal={totales.total}
      plazoElegido={0}
      planTotal={[]}
      mostrarDescargaImagen
      cliente={cliente}
      totalesGobierno={totales}
    />
  );

  if (vista === "cliente") {
    return (
      <div className="space-y-4">
        <VistaGobierno totales={totales} cliente={cliente} />
        {barra}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#E3EFFF] border border-[#BFD6F5] rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-[#0C4C9E]">
          Cotización institucional: siempre al contado, con detalle por renglón (modelo, cantidad, precio
          unitario, subtotal, ITBMS 7% y total). Descuento editable hasta 10%.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#DBE2EB] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#535E6F] mb-2 flex items-center gap-1.5">
          <User size={14} /> Datos de la institución
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Nombre / entidad" value={cliente.nombre} onChange={(v) => updateCliente("nombre", v)} placeholder="IPTA TONOSÍ" />
          <Campo label="RUC" value={cliente.ruc || ""} onChange={(v) => updateCliente("ruc", v)} />
          <Campo label="Cédula" value={cliente.cedula} onChange={(v) => updateCliente("cedula", v)} />
          <Campo label="Teléfono" value={cliente.telefono} onChange={(v) => updateCliente("telefono", v)} />
          <Campo label="Correo electrónico" value={cliente.correo} onChange={(v) => updateCliente("correo", v)} />
          <Campo label="Dirección" value={cliente.direccion} onChange={(v) => updateCliente("direccion", v)} placeholder="TONOSÍ" />
          <Campo
            label="Condiciones de pago"
            value={cliente.condicionesPago || ""}
            onChange={(v) => updateCliente("condicionesPago", v)}
            placeholder="Contado / orden de compra"
          />
          <div className="sm:col-span-2">
            <Campo
              label="Observaciones"
              value={cliente.observaciones || ""}
              onChange={(v) => updateCliente("observaciones", v)}
              placeholder="VÁLIDO 30 DÍAS"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {productos.map((p, idx) => (
          <GobiernoForm
            key={p.id}
            producto={p}
            index={idx}
            linea={totales.lineas[idx]}
            onChange={updateProducto}
            onRemove={removeProducto}
            canRemove={productos.length > 1}
          />
        ))}
        <button
          onClick={addProducto}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#B6C2D4] text-[#535E6F] hover:border-[#1F6DD8] hover:text-[#1F6DD8] transition-colors text-sm font-bold"
        >
          <Plus size={18} /> Agregar otro renglón
        </button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-[#68758A] font-bold mb-2">Vista de la cotización</p>
        <VistaGobierno totales={totales} cliente={cliente} />
      </div>

      <EnlaceGeneradorCard
        tipoCliente="gobierno"
        calculados={productos.map((p) => ({ ...p, calc: null as never }))}
        modo="ver"
        cliente={cliente}
      />
      {onFinalizar && (
        <button
          disabled={finalizando}
          onClick={onFinalizar}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#002362] hover:bg-[#003581] disabled:opacity-60 text-white font-bold transition-colors"
        >
          <BadgeCheck size={18} /> {finalizando ? "Guardando…" : etiquetaFinalizar}
        </button>
      )}

      {barra}
    </div>
  );
}

export const clienteGobiernoVacio = clienteVacio;

function Campo({
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
