import { useState } from "react";
import { Link2, Copy, Check, Printer, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { telefonoAWhatsapp, type CalculadoProducto, type CapacidadInfo, type ClienteInfo, type TipoCliente } from "@/lib/pricing-gbd";

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

      const nuevoId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const payload: Record<string, unknown> = {
        id: nuevoId,
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

      const { error } = await supabase.from("cotizaciones").insert(payload as never);
      if (error) throw error;

      const ruta = esImprimir ? "imprimir" : "cotizacion";
      setEnlace(`${window.location.origin}/${ruta}/${nuevoId}`);
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
    <div className="bg-white rounded-xl border border-[#DBE2EB] p-4">
      <p className="text-xs uppercase tracking-wide text-[#68758A] font-bold mb-1 flex items-center gap-1.5">
        <Icono size={14} /> {esImprimir ? "Enlace para imprimir" : "Enlace para el cliente"}
      </p>
      <p className="text-[11px] text-[#8793A5] mb-3">
        {esImprimir
          ? "Genera un enlace de un solo uso: abre una página lista para imprimir y se elimina automáticamente en cuanto se imprime."
          : "Genera un enlace temporal (válido 30 días) donde el cliente ve su cotización en modo lectura, sin precios internos."}
      </p>

      {estado !== "listo" && (
        <button
          onClick={generar}
          disabled={estado === "generando"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-bold text-sm transition-colors disabled:opacity-60 ${
            esImprimir ? "bg-[#1F6DD8] hover:bg-[#0054BD]" : "bg-[#002362] hover:bg-[#003581]"
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
              className="flex-1 min-w-0 border border-[#DBE2EB] rounded-lg px-2.5 py-2 text-xs text-[#535E6F] bg-[#F4F9FF]"
            />
            <button
              onClick={copiar}
              className="shrink-0 flex items-center gap-1 px-3 rounded-lg border border-[#DBE2EB] text-xs font-bold text-[#002362] hover:bg-[#F4F9FF]"
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
            <button onClick={generar} className="px-3 rounded-lg border border-[#DBE2EB] text-xs font-bold text-[#535E6F] hover:bg-[#F4F9FF]">
              Regenerar
            </button>
          </div>
          {esImprimir && (
            <p className="text-[10px] text-[#8793A5]">Este enlace deja de funcionar en cuanto alguien lo imprime desde ese link.</p>
          )}
        </div>
      )}
    </div>
  );
}
