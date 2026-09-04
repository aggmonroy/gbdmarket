import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearSolicitudCotizacion } from "@/lib/cotizaciones-carrito.functions";
import { SUCURSALES, SUCURSAL_LABEL, type Sucursal } from "@/lib/sucursales";
import { PUNTO_VENTA_PROGRESO, type LineaProgreso } from "@/lib/progreso";

/**
 * Convierte una cotización de El Progreso en una solicitud regular del carrito
 * de la mueblería. Los datos del cliente que llegan a GBD son los del punto de
 * venta El Progreso (ellos son el comprador/revendedor), nunca los del cliente
 * final que cotizó en El Progreso.
 */
export function ProgresoConvertirPedido({
  lineas,
  numero,
  open,
  onOpenChange,
}: {
  lineas: LineaProgreso[];
  numero: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const crear = useServerFn(crearSolicitudCotizacion);
  const [enviando, setEnviando] = useState(false);
  const [sucursal, setSucursal] = useState<Sucursal>("las-tablas");

  const enviar = async () => {
    const items = lineas
      .filter((l) => (l.nombre || "").trim())
      .map((l) => ({
        nombre: l.nombre.trim().slice(0, 200),
        modelo: (l.modelo || "").slice(0, 120),
        imagen: (l.imagen || "").slice(0, 600),
        descripcion: (l.descripcion || "").slice(0, 600),
        cantidad: Math.max(1, Math.min(99, Number(l.cantidad) || 1)),
      }));
    if (!items.length) return toast.error("La cotización no tiene artículos");

    setEnviando(true);
    try {
      await crear({
        data: {
          tipo_cliente: "tercero",
          sucursal,
          cliente: {
            nombre: PUNTO_VENTA_PROGRESO.nombre,
            telefono: PUNTO_VENTA_PROGRESO.whatsappVisible,
            cedula: "",
            correo: "",
            numero_asociado: "",
            ruc: "",
            direccion: "",
          },
          items,
          notas: `Pedido del punto de venta ${PUNTO_VENTA_PROGRESO.nombre} (convenio comercial), convertido desde su cotización ${numero}.`,
          consent: true,
        },
      } as never);
      toast.success("Pedido enviado a la mueblería. Un asesor de GBD dará seguimiento.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo convertir a pedido");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Convertir a pedido
          </DialogTitle>
          <DialogDescription>
            El pedido entra a la mueblería a nombre del punto de venta El Progreso (cotización {numero}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="font-semibold">{PUNTO_VENTA_PROGRESO.nombre}</p>
            <p className="text-muted-foreground">WhatsApp {PUNTO_VENTA_PROGRESO.whatsappVisible}</p>
            <p className="text-xs text-muted-foreground">{PUNTO_VENTA_PROGRESO.atencion}</p>
          </div>
          <div className="space-y-1">
            <Label>Sucursal que atiende</Label>
            <Select value={sucursal} onValueChange={(v) => setSucursal(v as Sucursal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUCURSALES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SUCURSAL_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={enviar} disabled={enviando} className="w-full">
          {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
          Enviar pedido a la mueblería
        </Button>
      </DialogContent>
    </Dialog>
  );
}
