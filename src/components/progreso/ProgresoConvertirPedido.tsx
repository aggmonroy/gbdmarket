import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearSolicitudCotizacion } from "@/lib/cotizaciones-carrito.functions";
import { SUCURSALES, SUCURSAL_LABEL, type Sucursal } from "@/lib/sucursales";
import type { LineaProgreso } from "@/lib/progreso";

type TipoCliente = "asociado" | "colaborador" | "tercero" | "gobierno";

const TIPOS: Array<{ v: TipoCliente; label: string }> = [
  { v: "tercero", label: "Cliente particular" },
  { v: "asociado", label: "Asociado" },
  { v: "colaborador", label: "Colaborador" },
  { v: "gobierno", label: "Pedido institucional" },
];

/**
 * Convierte una cotización de El Progreso en una solicitud regular del carrito
 * de la mueblería: el asesor de El Progreso llena los datos del cliente como
 * cualquier cliente directo y la solicitud entra al flujo normal de GBD.
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
  const [tipo, setTipo] = useState<TipoCliente>("tercero");
  const [sucursal, setSucursal] = useState<Sucursal>("las-tablas");
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
    correo: "",
    numero_asociado: "",
    ruc: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const enviar = async () => {
    if (form.nombre.trim().length < 3) return toast.error("Coloca el nombre completo del cliente");
    if (form.telefono.replace(/\D/g, "").length < 7) return toast.error("Coloca un WhatsApp válido");

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
          tipo_cliente: tipo,
          sucursal,
          cliente: {
            nombre: form.nombre.trim(),
            telefono: form.telefono.trim(),
            cedula: form.cedula.trim(),
            correo: form.correo.trim(),
            numero_asociado: form.numero_asociado.trim(),
            ruc: form.ruc.trim(),
            direccion: "",
          },
          items,
          notas: `Pedido convertido desde la cotización ${numero} del punto de venta Cooperativa El Progreso R.L.`,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Convertir a pedido
          </DialogTitle>
          <DialogDescription>
            Los datos del cliente pasan a la mueblería como una cotización regular del carrito ({numero}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="pp-nombre">Nombre completo *</Label>
            <Input id="pp-nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-tel">WhatsApp *</Label>
            <Input id="pp-tel" inputMode="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-ced">Cédula</Label>
            <Input id="pp-ced" value={form.cedula} onChange={(e) => set("cedula", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-mail">Correo</Label>
            <Input id="pp-mail" type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de cliente</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCliente)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.v} value={t.v}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tipo === "asociado" && (
            <div className="space-y-1">
              <Label htmlFor="pp-asoc">Número de asociado</Label>
              <Input id="pp-asoc" value={form.numero_asociado} onChange={(e) => set("numero_asociado", e.target.value)} />
            </div>
          )}
          {tipo === "gobierno" && (
            <div className="space-y-1">
              <Label htmlFor="pp-ruc">RUC de la institución</Label>
              <Input id="pp-ruc" value={form.ruc} onChange={(e) => set("ruc", e.target.value)} />
            </div>
          )}
          <div className="space-y-1 sm:col-span-2">
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
