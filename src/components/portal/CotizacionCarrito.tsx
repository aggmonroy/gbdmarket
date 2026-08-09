import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AsesorPage } from "@/components/calculadora/AsesorPage";
import { finalizarSolicitudCotizacion, obtenerSolicitudCotizacion } from "@/lib/cotizaciones-carrito.functions";
import { DESC_MAX_ASOCIADO, DESC_MAX_TERCERO, type ProductoInput } from "@/lib/pricing-gbd";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

/**
 * Cotización solicitada por el cliente desde su carrito: el sistema carga los
 * artículos y los datos del cliente, y el colaborador coloca el detalle de
 * precios en la calculadora para finalizar el proceso.
 */
export function CotizacionCarrito({
  sesion,
  tareaId,
  onFinalizada,
}: {
  sesion: Sesion;
  tareaId: string;
  onFinalizada: () => void;
}) {
  const obtenerFn = useServerFn(obtenerSolicitudCotizacion);
  const finalizarFn = useServerFn(finalizarSolicitudCotizacion);
  const [guardando, setGuardando] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cotizacion-carrito", tareaId],
    queryFn: () => obtenerFn({ data: { token: sesion.token, tarea_id: tareaId } }) as any,
  });

  if (isLoading)
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (error || !data)
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la solicitud de cotización. {(error as any)?.message ?? ""}
        </p>
        <Button className="mt-3" variant="outline" onClick={onFinalizada}>
          Volver
        </Button>
      </div>
    );

  const items: any[] = data.items ?? [];
  const productos: ProductoInput[] = items.map((i, idx) => ({
    id: `${data.id}-${idx}`,
    nombre: i.nombre || "",
    precioProveedor: "",
    precioEtiqueta: "",
    flete: "0",
    instalacion: "0",
    descAsociadoPct: DESC_MAX_ASOCIADO,
    descTerceroPct: DESC_MAX_TERCERO,
    imagen: i.imagen || "",
    descripcion: i.nombre || "",
    referencia: i.modelo || i.codigo || "",
    cantidad: String(i.cantidad || 1),
    precioUnitario: "",
    descGobiernoPct: 0,
  }));

  const cliente = {
    nombre: data.cliente?.nombre ?? "",
    cedula: data.cliente?.cedula ?? "",
    ruc: data.cliente?.ruc ?? "",
    telefono: data.cliente?.telefono ?? "",
    correo: data.cliente?.correo ?? "",
    direccion: data.cliente?.direccion ?? "",
  };

  const finalizar = async (payload: any) => {
    if (
      !payload.productos.some(
        (p: any) => Number(p.precioEtiqueta) > 0 || Number(p.precioProveedor) > 0 || Number(p.precioUnitario) > 0
      )
    ) {
      toast.error("Coloca el detalle de precio de los artículos antes de finalizar");
      return;
    }
    setGuardando(true);
    try {
      const r: any = await finalizarFn({
        data: {
          token: sesion.token,
          id: data.id,
          tipo_cliente: payload.tipoCliente,
          cliente: payload.cliente,
          productos: payload.productos.map(({ id: _id, ...rest }: any) => rest),
          capacidad: payload.capacidad ?? null,
        } as any,
      });
      toast.success(`Cotización ${r.numero} finalizada. El caso pasó a la bitácora de casos cerrados.`);
      onFinalizada();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo finalizar la cotización");
    } finally {
      setGuardando(false);
    }
  };

  const yaCotizada = data.estado === "cotizada";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold">Cotización {data.numero}</h2>
          <p className="text-sm text-muted-foreground">
            Solicitud del carrito de {cliente.nombre} · {items.length} artículo(s)
            {yaCotizada && " · ya cotizada"}
          </p>
        </div>
        <Button variant="outline" onClick={onFinalizada}>
          Volver a Solicitudes Activas
        </Button>
      </div>

      <AsesorPage
        inicial={{ tipoCliente: data.tipo_cliente ?? "asociado", cliente, productos }}
        encabezado={
          <div className="rounded-xl border border-[#DBE2EB] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#535E6F]">Solicitud del cliente</p>
            <p className="mt-1 text-sm font-bold text-[#002362]">Cotización {data.numero}</p>
            <ul className="mt-2 space-y-1 text-sm text-[#535E6F]">
              {items.map((i, idx) => (
                <li key={idx}>
                  {i.cantidad} × {i.nombre}
                  {i.codigo ? ` (Código ${i.codigo})` : ""}
                </li>
              ))}
            </ul>
            {data.notas && <p className="mt-2 text-xs text-[#68758A]">Nota del cliente: {data.notas}</p>}
          </div>
        }
        onFinalizar={finalizar}
        finalizando={guardando}
        etiquetaFinalizar="Finalizar cotización y cerrar el caso"
      />
    </div>
  );
}
