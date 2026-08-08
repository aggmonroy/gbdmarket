import { useState } from "react";
import { Share2, Download, Image as ImageIcon } from "lucide-react";
import { etiquetaTipoCliente, fmt, telefonoAWhatsapp, type CalculadoProducto, type CapacidadInfo, type ClienteInfo, type PlazoCuota, type TipoCliente } from "@/lib/pricing-gbd";
import { generarImagenCotizacion } from "@/lib/generar-imagen-gbd";

interface Props {
  tipoCliente: TipoCliente;
  calculados: CalculadoProducto[];
  contadoTotal: number;
  creditoTotal: number;
  plazoElegido: number;
  cuota?: PlazoCuota;
  planTotal: PlazoCuota[];
  mostrarDescargaImagen?: boolean;
  cliente?: ClienteInfo;
  capacidad?: CapacidadInfo;
  promo?: { precioEtiqueta: number; cuota3m: number; meses: number };
}


function buildResumenTexto({ tipoCliente, calculados, contadoTotal, creditoTotal, plazoElegido, cuota, cliente }: Props) {
  const saludo = cliente?.nombre ? `Hola ${cliente.nombre.split(" ")[0]},\n\n` : "";
  const lineas = [
    `${saludo}*Cooperativa Gladys B. de Ducasa R.L. — Línea Blanca*`,
    `Cotización (${etiquetaTipoCliente(tipoCliente)})`,
    "",
    "*Productos:*",
    ...calculados.map(({ nombre }, i) => `- ${nombre || `Producto ${i + 1}`}`),
    "",
    `Total al contado: ${fmt(contadoTotal)}`,
    `Total a crédito: ${fmt(creditoTotal)}`,
  ];
  if (cuota) {
    lineas.push(`Plazo ${plazoElegido} meses: ${fmt(cuota.cuotaMensual)}/mes (${fmt(cuota.letraQuincenal)} quincenal)`);
  }
  lineas.push("", "Cotización válida por 30 días o hasta agotar existencias.");
  return lineas.join("\n");
}

export function ActionBar(props: Props) {
  const { tipoCliente, calculados, contadoTotal, creditoTotal, planTotal, mostrarDescargaImagen, cliente, capacidad, promo } = props;
  const [generando, setGenerando] = useState(false);


  const enviarWhatsApp = () => {
    const texto = buildResumenTexto(props);
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

  const imprimir = () => window.print();

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const dataUrl = await generarImagenCotizacion({ tipoCliente, calculados, contadoTotal, creditoTotal, planTotal, cliente, capacidad, promo });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "cotizacion-gbd.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar la imagen. Intenta con 'Guardar / Imprimir' como alternativa.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 no-imprimir">
      <button
        onClick={enviarWhatsApp}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1FB955] text-white font-bold text-sm transition-colors shadow-sm"
      >
        <Share2 size={16} /> Enviar por WhatsApp
      </button>
      {mostrarDescargaImagen && (
        <button
          onClick={descargarImagen}
          disabled={generando}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1F6DD8] hover:bg-[#0054BD] disabled:opacity-60 text-white font-bold text-sm transition-colors shadow-sm"
        >
          <ImageIcon size={16} /> {generando ? "Generando..." : "Descargar imagen"}
        </button>
      )}
      <button
        onClick={imprimir}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-[#002362] text-[#002362] font-bold text-sm hover:bg-[#F4F9FF] transition-colors"
      >
        <Download size={16} /> Guardar / Imprimir
      </button>
    </div>
  );
}
