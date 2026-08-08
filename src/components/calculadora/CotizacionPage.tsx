import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  calcularProducto,
  calcularTotales,
  type CapacidadInfo,
  type ClienteInfo,
  type ProductoInput,
  type TipoCliente,
  esAsociado,
} from "@/lib/pricing-gbd";
import { VistaCliente } from "@/components/VistaCliente";
import { ActionBar } from "@/components/ActionBar";
import logoIcono from "@/assets/calculadora/logo-icono.png";

interface CotizacionRow {
  tipo_cliente: TipoCliente;
  productos: ProductoInput[];
  creado_en: string;
  cliente?: ClienteInfo | null;
  capacidad?: CapacidadInfo | null;
}

export function CotizacionPage({ id }: { id: string }) {

  const [estado, setEstado] = useState<"cargando" | "ok" | "no-encontrado" | "expirado">("cargando");
  const [datos, setDatos] = useState<CotizacionRow | null>(null);
  const [plazoElegido, setPlazoElegido] = useState(12);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (!id) {
        setEstado("no-encontrado");
        return;
      }
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("tipo_cliente, productos, creado_en, cliente, capacidad")
        .eq("id", id)
        .eq("modo", "ver")
        .maybeSingle();

      if (!activo) return;
      if (error || !data) {
        console.error("Error cargando cotización:", error);
        setEstado("no-encontrado");
        return;
      }
      const dias = (Date.now() - new Date(data.creado_en).getTime()) / (1000 * 60 * 60 * 24);
      if (dias > 30) {
        setEstado("expirado");
        return;
      }
      setDatos(data as unknown as CotizacionRow);
      setEstado("ok");
    })();
    return () => {
      activo = false;
    };
  }, [id]);

  if (estado === "cargando") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF]">
        <p className="text-[#002362] font-bold text-sm">Cargando cotización...</p>
      </div>
    );
  }

  if (estado === "no-encontrado" || estado === "expirado" || !datos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF] px-6 text-center">
        <div>
          <img src={logoIcono} alt="GBD" className="h-16 w-16 mx-auto mb-4 rounded-xl shadow-sm" />
          <p className="font-bold text-[#002362] text-lg mb-1">
            {estado === "expirado" ? "Este enlace ya expiró" : "No encontramos esta cotización"}
          </p>
          <p className="text-sm text-[#68758A]">
            {estado === "expirado"
              ? "Las cotizaciones son válidas por 30 días. Solicita a tu asesor un nuevo enlace."
              : "Verifica el enlace o solicita a tu asesor que te lo reenvíe."}
          </p>
        </div>
      </div>
    );
  }

  const calculados = datos.productos.map((p) => ({ ...p, calc: calcularProducto(p) }));
  const totales = calcularTotales(calculados, datos.tipo_cliente);
  const contadoTotal = esAsociado(datos.tipo_cliente) ? totales.promoAsociado : totales.promoTercero;
  const creditoTotal = esAsociado(datos.tipo_cliente) ? totales.precioCreditoAsociado : totales.precioCreditoTercero;
  const diasRestantes = Math.max(0, 30 - Math.floor((Date.now() - new Date(datos.creado_en).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-[#F4F9FF] text-[#071123]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="bg-[#002362] text-[#F4F9FF]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logoIcono} alt="Cooperativa Gladys B. de Ducasa" className="h-14 w-14 rounded-lg bg-white/95 p-1 shadow-sm shrink-0" />
            <div className="leading-tight">
              <p className="text-sm sm:text-base font-bold">
                Cooperativa de Servicios Integrales Gladys B. De Ducasa, R.L.
              </p>
              <p className="text-xs sm:text-sm font-bold text-[#B0C6E5]">
                Sección Línea Blanca y Bordados
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#002362]">Tu cotización</h1>
          <p className="text-xs text-[#68758A] font-bold mt-1">
            {diasRestantes > 0 ? `Vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}` : "Vence hoy"}
          </p>
        </div>
        <VistaCliente
          calculados={calculados}
          totales={totales}
          tipoCliente={datos.tipo_cliente}
          plazoElegido={plazoElegido}
          setPlazoElegido={setPlazoElegido}
          cliente={datos.cliente ?? undefined}
        />
        <ActionBar
          tipoCliente={datos.tipo_cliente}
          calculados={calculados}
          contadoTotal={contadoTotal}
          creditoTotal={creditoTotal}
          plazoElegido={plazoElegido}
          cuota={totales.planTotal.find((r) => r.meses === plazoElegido)}
          planTotal={totales.planTotal}
          mostrarDescargaImagen
          cliente={datos.cliente ?? undefined}
          
          promo={
            esAsociado(datos.tipo_cliente)
              ? { precioEtiqueta: totales.precioContado, cuota3m: totales.cuotaPromoContado, meses: totales.mesesPromo }
              : undefined
          }
        />

      </div>
    </div>
  );
}
