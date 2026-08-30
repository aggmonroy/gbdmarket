import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enlaceProducto } from "@/lib/compartir";
import type { Socio } from "@/lib/socio";

/**
 * Modo socio aliado: en lugar del carrito de cotización, el cliente envía
 * el enlace del artículo directamente al WhatsApp del socio.
 */
export function SocioProductoDialog({
  open,
  onOpenChange,
  socio,
  producto,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  socio: Socio;
  producto: { id: string; name: string; brand?: string | null; model?: string | null } | null;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");

  if (!producto) return null;

  const valido = nombre.trim().length >= 3 && telefono.replace(/\D/g, "").length >= 7;

  const enviar = () => {
    const texto = [
      `Hola ${socio.nombre}, deseo información sobre este artículo:`,
      `${producto.name}${producto.model ? ` (Modelo ${producto.model})` : ""}`,
      enlaceProducto(producto.id),
      `Nombre: ${nombre.trim()}`,
      `WhatsApp: ${telefono.trim()}`,
      notas.trim() ? `Notas: ${notas.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/${socio.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Consultar por WhatsApp</DialogTitle>
          <DialogDescription>
            Enviaremos el enlace de este artículo a {socio.nombre} para que te atienda directamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="font-semibold">{producto.name}</div>
            {producto.model && <div className="text-xs text-muted-foreground">Modelo {producto.model}</div>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-nombre">Nombre completo *</Label>
            <Input id="s-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-tel">WhatsApp *</Label>
            <Input id="s-tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={30} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-notas">Comentarios (opcional)</Label>
            <Textarea id="s-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={600} />
          </div>
          <Button
            className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
            size="lg"
            disabled={!valido}
            onClick={enviar}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
