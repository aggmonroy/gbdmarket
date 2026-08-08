import { useCallback, useEffect, useRef, useState } from "react";

import { Printer, FileDown } from "lucide-react";
import { getCotizacion, eliminarCotizacion } from "@/lib/cotizaciones.functions";
import {
  calcularProducto,
  calcularTotales,
  fmt,
  type CapacidadInfo,
  type ClienteInfo,
  type ProductoInput,
  type TipoCliente,
  esAsociado,
  etiquetaTipoCliente,
} from "@/lib/pricing-gbd";
import logoIcono from "@/assets/calculadora/logo-icono.png";

interface CotizacionRow {
  tipo_cliente: TipoCliente;
  productos: ProductoInput[];
  creado_en: string;
  cliente?: ClienteInfo | null;
  capacidad?: CapacidadInfo | null;
}

export function ImprimirPage({ id }: { id: string }) {

  const [estado, setEstado] = useState<"cargando" | "listo" | "usado" | "no-encontrado">("cargando");
  const [datos, setDatos] = useState<CotizacionRow | null>(null);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (!id) {
        setEstado("no-encontrado");
        return;
      }
      const data = await getCotizacion({ data: { id, modo: "imprimir" } }).catch(() => null);

      if (!activo) return;
      if (!data) {
        const error = new Error("Documento no encontrado");
        console.error("Error cargando documento para imprimir:", error);
        setEstado("no-encontrado");
        return;
      }
      setDatos(data as unknown as CotizacionRow);
      setEstado("listo");
    })();
    return () => {
      activo = false;
    };
  }, [id]);

  const eliminarEnlace = useCallback(async () => {
    if (id) {
      await eliminarCotizacion({ data: { id } }).catch((error) =>
        console.error("No se pudo eliminar la cotización:", error),
      );
    }
    setEstado("usado");
  }, [id]);

  useEffect(() => {
    if (estado !== "listo") return;
    window.addEventListener("afterprint", eliminarEnlace);
    return () => window.removeEventListener("afterprint", eliminarEnlace);
  }, [estado, eliminarEnlace]);

  const descargarPdf = useCallback(async () => {
    if (!docRef.current) return;
    setDescargandoPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      // 8.5" x 14" (legal)
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: [8.5, 14] });
      const pageW = 8.5;
      const pageH = 14;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage([8.5, 14], "portrait");
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save("cotizacion-gbd.pdf");
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el PDF. Usa 'Imprimir' y elige 'Guardar como PDF'.");
    } finally {
      setDescargandoPdf(false);
    }
  }, []);

  if (estado === "cargando") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF]">
        <p className="text-[#002362] font-bold text-sm">Cargando documento...</p>
      </div>
    );
  }

  if (estado === "no-encontrado" || estado === "usado" || !datos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF] px-6 text-center">
        <div>
          <img src={logoIcono} alt="GBD" className="h-16 w-16 mx-auto mb-4 rounded-xl shadow-sm" />
          <p className="font-bold text-[#002362] text-lg mb-1">
            {estado === "usado" ? "Este documento ya fue impreso" : "Este enlace ya no está disponible"}
          </p>
          <p className="text-sm text-[#68758A]">
            Es un enlace de un solo uso y se eliminó automáticamente. Solicita a tu asesor uno nuevo si lo necesitas.
          </p>
        </div>
      </div>
    );
  }

  const calculados = datos.productos.map((p) => ({ ...p, calc: calcularProducto(p) }));
  const totales = calcularTotales(calculados, datos.tipo_cliente);
  const contadoTotal = esAsociado(datos.tipo_cliente) ? totales.promoAsociado : totales.promoTercero;
  const tipo_cliente_asociado = esAsociado(datos.tipo_cliente);
  const creditoTotal = esAsociado(datos.tipo_cliente) ? totales.precioCreditoAsociado : totales.precioCreditoTercero;
  const fecha = new Date(datos.creado_en).toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric" });
  const cliente = datos.cliente;
  const capacidad = datos.capacidad;
  const tieneCliente = !!cliente && Object.values(cliente).some((v) => (v ?? "").toString().trim() !== "");

  return (
    <div className="min-h-screen bg-[#E3EFFF]">
      <style>{`
        @media print {
          .no-imprimir { display: none !important; }
          @page { size: 8.5in 14in; margin: 0.4in; }
        }
      `}</style>

      <div className="no-imprimir sticky top-0 z-10 bg-[#002362] text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold max-w-xs">Enlace de un solo uso — se elimina automáticamente al imprimir</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={descargarPdf}
            disabled={descargandoPdf}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1FB955] disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <FileDown size={16} /> {descargandoPdf ? "Generando..." : "Descargar PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1F6DD8] hover:bg-[#0054BD] px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button
            onClick={eliminarEnlace}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            Ya imprimí, eliminar
          </button>
        </div>
      </div>

      <div ref={docRef} className="max-w-[8.5in] mx-auto bg-white my-6 shadow-lg">
        <div className="bg-[#002362] px-8 py-6 flex items-center gap-4">
          <img src={logoIcono} alt="Cooperativa Gladys B. de Ducasa" className="h-16 w-16 rounded-lg bg-white p-1 shrink-0" />
          <div className="text-white leading-tight">
            <p className="text-base font-bold">
              Cooperativa de Servicios Integrales Gladys B. De Ducasa, R.L.
            </p>
            <p className="text-sm font-bold text-[#B0C6E5]">
              Sección Línea Blanca y Bordados
            </p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-[#002362]">Cotización</h1>
            <p className="text-xs font-bold text-[#68758A]">
              {fecha} · {etiquetaTipoCliente(datos.tipo_cliente)}
            </p>
          </div>

          {tieneCliente && cliente && (
            <div className="border border-[#DBE2EB] rounded-lg px-4 py-3">
              <p className="text-xs uppercase font-bold text-[#68758A] mb-2">Datos del cliente</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {cliente.nombre && <InfoLine label="Nombre" value={cliente.nombre} />}
                {cliente.cedula && <InfoLine label="Cédula" value={cliente.cedula} />}
                {cliente.telefono && <InfoLine label="Teléfono" value={cliente.telefono} />}
                {cliente.correo && <InfoLine label="Correo" value={cliente.correo} />}
                {cliente.direccion && (
                  <div className="col-span-2">
                    <InfoLine label="Dirección" value={cliente.direccion} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase font-bold text-[#68758A] mb-2">Productos cotizados</p>
            <div className="space-y-2">
              {calculados.map(({ nombre, imagen, descripcion, calc }, i) => {
                const precioFinal = esAsociado(datos.tipo_cliente) ? calc.promoAsociado : calc.promoTercero;
                const precioCredito = esAsociado(datos.tipo_cliente) ? calc.precioCreditoAsociado : calc.precioCreditoTercero;
                return (
                  <div key={i} className="border border-[#DBE2EB] rounded-lg px-3 py-2.5 flex items-start gap-3">
                    {imagen && (
                      <img
                        src={imagen}
                        alt={nombre || `Producto ${i + 1}`}
                        className="w-16 h-16 rounded-md object-cover border border-[#DBE2EB] shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between flex-wrap gap-1">
                        <span className="text-sm font-bold text-[#002362]">{nombre || `Producto ${i + 1}`}</span>
                        <span className="text-xs font-bold text-[#535E6F]">
                          Contado {fmt(precioFinal)} · Crédito {fmt(precioCredito)}
                        </span>
                      </div>
                      {descripcion && (
                        <p className="text-[11px] text-[#535E6F] mt-1 whitespace-pre-wrap">{descripcion}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#002362] text-white rounded-xl px-5 py-4 text-center">
            <p className="text-[10px] uppercase font-bold text-[#B0C6E5]">Total pago al contado</p>
            <p className="text-2xl font-bold">{fmt(contadoTotal)}</p>
          </div>

          <div>
            <p className="text-xs uppercase font-bold text-[#68758A] mb-2">Plazos disponibles a crédito (total {fmt(creditoTotal)})</p>
            <div className="grid grid-cols-2 gap-2">
              {totales.planTotal.map((row) => (
                <div key={row.meses} className="border border-[#DBE2EB] rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-[#002362]">{row.meses} meses</p>
                  <p className="text-sm font-bold text-[#002362]">{fmt(row.cuotaMensual)}/mes</p>
                  <p className="text-[10px] font-bold text-[#68758A]">{fmt(row.letraQuincenal)} quincenal</p>
                </div>
              ))}
            </div>
          </div>

          {tipo_cliente_asociado && (
            <div className="rounded-xl overflow-hidden border-2 border-[#1F6DD8]">
              <div className="bg-[#1F6DD8] text-white px-4 py-2 text-center">
                <p className="text-[10px] uppercase tracking-widest font-bold">{datos.tipo_cliente === "colaborador" ? "¡Promoción exclusiva para colaboradores GBD!" : "¡Promoción exclusiva para asociados!"}</p>
                <p className="text-sm font-bold">{totales.mesesPromo} meses a precio de contado</p>
              </div>
              <div className="bg-[#E3EFFF] px-4 py-3 text-center">
                <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Precio de etiqueta</p>
                <p className="text-xl font-bold text-[#002362] mb-2">{fmt(totales.precioContado)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg border border-[#BFD6F5] px-3 py-2">
                    <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Abono inicial</p>
                    <p className="text-sm font-bold text-[#002362]">{fmt(totales.cuotaPromoContado)}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-[#BFD6F5] px-3 py-2">
                    <p className="text-[10px] uppercase font-bold text-[#0C4C9E]">Quincenal</p>
                    <p className="text-sm font-bold text-[#002362]">{fmt(totales.cuotaPromoContado / 2)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#0C4C9E] mt-1.5">Sujeto a capacidad comprobada</p>
              </div>
            </div>
          )}

          {capacidad && (
            <div
              className={`rounded-lg border px-4 py-3 ${
                capacidad.aprueba ? "border-[#B7D5B0] bg-[#E4EEE0]" : "border-[#E9C4B4] bg-[#FBEAE4]"
              }`}
            >
              <p className="text-xs uppercase font-bold text-[#535E6F] mb-2">Evaluación de capacidad de pago</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <InfoLine label="Ingreso mensual" value={fmt(capacidad.ingreso)} />
                <InfoLine label="Deuda actual" value={fmt(capacidad.deudaActual)} />
                <InfoLine label="Tope legal" value={fmt(capacidad.ingreso * capacidad.topePct)} />
                <InfoLine label="Disponible tras deuda" value={fmt(capacidad.limiteCuota)} />
                <InfoLine label={`Cuota propuesta (${capacidad.plazoMeses} meses)`} value={fmt(capacidad.cuotaPropuesta)} />
                <InfoLine
                  label="Resultado"
                  value={capacidad.aprueba ? "Dentro del límite" : "Excede el límite legal"}
                />
              </div>
              <p className="text-[10px] text-[#68758A] mt-2 leading-relaxed">
                Aplica el tope legal panameño de endeudamiento vigente. Sujeto a confirmación final por la cooperativa.
              </p>
            </div>
          )}

          <div className="bg-[#E3EFFF] text-[#0C4C9E] rounded-full text-center py-2 text-xs font-bold">
            Cotización válida por 30 días o hasta agotar existencias
          </div>

          <p className="text-center text-xs font-bold text-[#68758A]">WhatsApp Línea Blanca: +507 6784-1941</p>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#68758A]">{label}</span>
      <span className="font-bold text-[#002362] text-right">{value}</span>
    </div>
  );
}
