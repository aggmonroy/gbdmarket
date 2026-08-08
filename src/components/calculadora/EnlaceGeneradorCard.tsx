import { useState } from "react";
import { Link2, Copy, Check, Printer, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { telefonoAWhatsapp, type CalculadoProducto, type CapacidadInfo, type ClienteInfo, type TipoCliente } from "@/lib/pricing";

interface Props {
  tipoCliente: TipoCliente;
  calculados: CalculadoProducto[];
  modo: "ver" | "imprimir";
  cliente?: ClienteInfo;
  capacidad?: CapacidadInfo;
}

export function EnlaceGeneradorCard({ tipoCliente, calculados, modo, cliente, capacidad }: Props) {
  const esImprimir = modo === "imprimir";
  const [estado, setEstado] = useState<"idle" | "generando" | "listo" | "error">("idle");
  const [enlace, setEnlace] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  const generar = async () => {
    setEstado("generando");
    setCopiado(false);
    setMensajeError("");
    try {
      const productos = calculados.map(({ calc: _calc, ...rest }) => rest);

      const payload: Record<string, unknown> = {
        tipo_cliente: tipoCliente,
        modo,
        productos,
      };
      if (cliente && Object.values(cliente).some((v) => (v ?? "").trim() !== "")) {
        payload.cliente = cliente;
      }
      if (capacidad) {
        payload.capacidad = capacidad;
      }

      const { data, error } = await supabase
        .from("cotizaciones")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error("No se recibió ID de la cotización");

      const ruta = esImprimir ? "imprimir" : "cotizacion";
      setEnlace(`${window.location.origin}/${ruta}/${data.id}`);
      setEstado("listo");
    } catch (e) {
      console.error("Error generando enlace:", e);
      setMensajeError(e instanceof Error ? e.message : String(e));
      setEstado("error");
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // el input queda seleccionable para copiar manualmente
    }
  };

  const enviarPorWhatsApp = () => {
    const saludo = cliente?.nombre ? `Hola ${cliente.nombre.split(" ")[0]}, ` : "";
    const texto = esImprimir
      ? `*Cooperativa Gladys B. de Ducasa R.L. — Línea Blanca*\n${saludo}aquí tienes tu documento para imprimir (enlace de un solo uso):\n${enlace}`
      : `*Cooperativa Gladys B. de Ducasa R.L. — Línea Blanca*\n${saludo}aquí tienes tu cotización:\n${enlace}\n\nVálida por 30 días o hasta agotar existencias.`;
    const numeroCliente = telefonoAWhatsapp(cliente?.telefono || "");
    const destino = numeroCliente || "50767841941";
    const a = document.createElement("a");
    a.href = `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const Icono = esImprimir ? Printer : Link2;

  return (
    <div className="bg-white rounded-xl border border-[#E4DDC9] p-4">
      <p className="text-xs uppercase tracking-wide text-[#8A836C] font-bold mb-1 flex items-center gap-1.5">
        <Icono size={14} /> {esImprimir ? "Enlace para imprimir" : "Enlace para el cliente"}
      </p>
      <p className="text-[11px] text-[#B0A98C] mb-3">
        {esImprimir
          ? "Genera un enlace de un solo uso: abre una página lista para imprimir y se elimina automáticamente en cuanto se imprime."
          : "Genera un enlace temporal (válido 30 días) donde el cliente ve su cotización en modo lectura, sin precios internos."}
      </p>

      {estado !== "listo" && (
        <button
          onClick={generar}
          disabled={estado === "generando"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-bold text-sm transition-colors disabled:opacity-60 ${
            esImprimir ? "bg-[#C97B3D] hover:bg-[#B36A2F]" : "bg-[#1F3A38] hover:bg-[#2E524F]"
          }`}
        >
          <Icono size={16} /> {estado === "generando" ? "Generando enlace..." : "Generar enlace"}
        </button>
      )}

      {estado === "error" && (
        <div className="mt-2 bg-[#FBEAE4] border border-[#E9C4B4] rounded-lg p-2.5">
          <p className="text-xs text-[#9C4A2E] font-bold">No se pudo generar el enlace</p>
          <p className="text-[11px] text-[#9C4A2E] mt-0.5 break-words">{mensajeError}</p>
        </div>
      )}

      {estado === "listo" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              readOnly
              value={enlace}
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 border border-[#E4DDC9] rounded-lg px-2.5 py-2 text-xs text-[#6B6552] bg-[#F5F1E8]"
            />
            <button
              onClick={copiar}
              className="shrink-0 flex items-center gap-1 px-3 rounded-lg border border-[#E4DDC9] text-xs font-bold text-[#1F3A38] hover:bg-[#F5F1E8]"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={enviarPorWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25D366] hover:bg-[#1FB955] text-white font-bold text-xs transition-colors"
            >
              <Share2 size={14} /> Enviar enlace por WhatsApp
            </button>
            <button onClick={generar} className="px-3 rounded-lg border border-[#E4DDC9] text-xs font-bold text-[#6B6552] hover:bg-[#F5F1E8]">
              Regenerar
            </button>
          </div>
          {esImprimir && (
            <p className="text-[10px] text-[#B0A98C]">Este enlace deja de funcionar en cuanto alguien lo imprime desde ese link.</p>
          )}
        </div>
      )}
    </div>
  );
}
