import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Minus, Package, Plus, ShoppingCart, Trash2, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataConsent } from "@/components/site/DataConsent";
import { useCart } from "@/lib/cart";
import { crearSolicitudCotizacion } from "@/lib/cotizaciones-carrito.functions";
import { buildWaUrl } from "@/lib/whatsapp";

const TIPOS = [
  { value: "asociado", label: "Asociado" },
  { value: "colaborador", label: "Colaborador GBD" },
  { value: "tercero", label: "No asociado (tercero)" },
  { value: "gobierno", label: "Pedido institucional" },
] as const;

export function CartButton() {
  const { items, total, remove, setCantidad, clear, abierto, setAbierto } = useCart();
  const [form, setForm] = useState(false);

  return (
    <>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <button
            aria-label="Carrito de cotización"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground/80 hover:bg-accent transition"
          >
            <ShoppingCart className="h-5 w-5" />
            {total > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {total}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">Tu carrito de cotización</SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {!items.length && (
              <p className="text-sm text-muted-foreground">
                Agrega artículos del catálogo y al final solicita una sola cotización con todos ellos.
              </p>
            )}
            {items.map((i) => (
              <div key={i.id} className="flex gap-3 rounded-lg border border-border p-2">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {i.image ? (
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[i.brand, i.model && `Modelo ${i.model}`].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCantidad(i.id, i.cantidad - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{i.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCantidad(i.id, i.cantidad + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => remove(i.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Un colaborador preparará el detalle de precios y cuotas de todos tus artículos.
              </p>
              <Button className="w-full" size="lg" onClick={() => setForm(true)}>
                Solicitar cotización ({total})
              </Button>
              <Button variant="ghost" className="w-full" onClick={clear}>
                Vaciar carrito
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CartQuoteDialog open={form} onOpenChange={setForm} />
    </>
  );
}

function CartQuoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { items, clear, setAbierto } = useCart();
  const crear = useServerFn(crearSolicitudCotizacion);
  const [tipo, setTipo] = useState<"asociado" | "colaborador" | "tercero" | "gobierno">("asociado");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [ruc, setRuc] = useState("");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [numero, setNumero] = useState("");

  const enviar = async () => {
    if (!consent) {
      toast.error("Debes aceptar el tratamiento de datos");
      return;
    }
    setEnviando(true);
    try {
      const r: any = await crear({
        data: {
          tipo_cliente: tipo,
          cliente: {
            nombre: nombre.trim(),
            cedula: cedula.trim(),
            ruc: ruc.trim(),
            numero_asociado: numeroAsociado.trim(),
            telefono: telefono.trim(),
            correo: correo.trim(),
            direccion: direccion.trim(),
          },
          items: items.map((i) => ({
            product_id: i.id,
            nombre: i.name,
            marca: i.brand ?? "",
            modelo: i.model ?? "",
            codigo: i.code ?? "",
            imagen: i.image ?? "",
            cantidad: i.cantidad,
          })),
          notas: notas.trim(),
          consent: true,
        } as any,
      });
      setNumero(r.numero);
      clear();
      setAbierto(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes("email") ? "Revisa el correo electrónico" : "Revisa los datos e intenta nuevamente");
    } finally {
      setEnviando(false);
    }
  };

  // Solo nombre y WhatsApp son obligatorios; el correo se valida si lo escriben.
  const completo =
    nombre.trim().length >= 3 &&
    telefono.replace(/\D/g, "").length >= 7 &&
    (tipo !== "asociado" || numeroAsociado.trim().length >= 1) &&
    (!correo.trim() || /.+@.+\..+/.test(correo.trim()));

  return (
    <Dialog
      open={open}
      onOpenChange={(b) => {
        onOpenChange(b);
        if (!b) setNumero("");
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {numero ? "¡Solicitud registrada!" : "Solicitar cotización de tu carrito"}
          </DialogTitle>
          <DialogDescription>
            {numero
              ? "Un colaborador preparará el detalle de precios y te contactará."
              : "Completa tus datos. Los precios y cuotas los calcula un colaborador de la cooperativa."}
          </DialogDescription>
        </DialogHeader>

        {numero ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-primary-soft/40 p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Número de cotización</div>
              <div className="font-display text-2xl font-bold text-primary">{numero}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Guarda este número: con él podemos ubicar tu solicitud en cualquier sucursal.
            </p>
            <a
              href={buildWaUrl("linea-blanca", `Hola Mueblería GBD,\nSolicité una cotización de línea blanca.\nNúmero: ${numero}${nombre ? `\nNombre: ${nombre.trim()}` : ""}${telefono ? `\nWhatsApp: ${telefono.trim()}` : ""}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" type="button">
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar por WhatsApp
              </Button>
            </a>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Listo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de cliente</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      tipo === t.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:bg-accent"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="c-nombre">{tipo === "gobierno" ? "Institución / entidad *" : "Nombre completo *"}</Label>
                <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-tel">WhatsApp *</Label>
                <Input id="c-tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={30} />
              </div>
              {tipo === "asociado" && (
                <div className="space-y-1.5">
                  <Label htmlFor="c-asociado">Número de asociado *</Label>
                  <Input
                    id="c-asociado"
                    value={numeroAsociado}
                    onChange={(e) => setNumeroAsociado(e.target.value)}
                    maxLength={40}
                  />
                </div>
              )}
              {tipo === "gobierno" && (
                <div className="space-y-1.5">
                  <Label htmlFor="c-ruc">RUC de la institución (opcional)</Label>
                  <Input id="c-ruc" value={ruc} onChange={(e) => setRuc(e.target.value)} maxLength={60} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="c-cedula">{tipo === "gobierno" ? "Cédula del contacto (opcional)" : "Cédula (opcional)"}</Label>
                <Input id="c-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} maxLength={40} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-mail">Correo electrónico (opcional)</Label>
                <Input id="c-mail" inputMode="email" value={correo} onChange={(e) => setCorreo(e.target.value)} maxLength={160} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="c-dir">Dirección (opcional)</Label>
                <Input id="c-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={300} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="c-notas">Comentarios (opcional)</Label>
                <Textarea id="c-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={1000} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {items.length} artículo(s): {items.map((i) => `${i.cantidad} × ${i.name}`).join(", ")}
            </div>

            <DataConsent accepted={consent} onChange={setConsent} id="carrito-consent" />

            <Button className="w-full" size="lg" disabled={!completo || !consent || enviando} onClick={enviar}>
              {enviando ? "Enviando…" : "Enviar solicitud de cotización"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
