import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataConsent } from "@/components/site/DataConsent";
import { crearPreorden } from "@/lib/pedidos.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  canal: "linea-blanca" | "bordados";
  titulo?: string;
  /** Descripción inicial del artículo o servicio solicitado. */
  itemInicial?: string;
  detalle?: string;
  meta?: Record<string, unknown>;
};

export function QuoteFormDialog({
  open, onOpenChange, canal, titulo, itemInicial = "", detalle = "", meta,
}: Props) {
  const crear = useServerFn(crearPreorden);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [item, setItem] = useState(itemInicial);
  const [notas, setNotas] = useState("");
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (nombre.trim().length < 2) { toast.error("Ingresa tu nombre"); return; }
    if (!telefono.trim()) { toast.error("Ingresa tu teléfono o WhatsApp"); return; }
    if (!item.trim()) { toast.error("Indica qué deseas cotizar"); return; }
    if (!consent) { toast.error("Debes aceptar el tratamiento de datos"); return; }
    setEnviando(true);
    try {
      const r: any = await crear({ data: {
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email,
        origen: canal === "bordados" ? "bordados" : "catalogo",
        canal,
        categoria: canal,
        observaciones: notas,
        items: [{ cantidad: 1, descripcion: item.slice(0, 300), detalle: detalle.slice(0, 400) }],
        meta: { ...(meta ?? {}) },
        consent: true,
      } as any });
      onOpenChange(false);
      window.location.href = `/pedido/${r.numero_pedido}?t=${encodeURIComponent(r.token)}`;
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo generar la solicitud. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {titulo ?? (canal === "bordados" ? "Cotizar bordados" : "Solicitar cotización")}
          </DialogTitle>
          <DialogDescription>
            Completa tus datos: generamos tu pre-orden en la bitácora y luego podrás enviarla por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input placeholder="Tu nombre *" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Teléfono / WhatsApp *" value={telefono} maxLength={30} onChange={(e) => setTelefono(e.target.value)} />
          <Input placeholder="Correo electrónico (opcional)" value={email} maxLength={160} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="¿Qué deseas cotizar? *" value={item} maxLength={300} onChange={(e) => setItem(e.target.value)} />
          <Textarea placeholder="Detalles, cantidades o preferencias (opcional)" rows={3} maxLength={1000} value={notas} onChange={(e) => setNotas(e.target.value)} />
          <DataConsent accepted={consent} onChange={setConsent} id={`quote-consent-${canal}`} />
          <Button onClick={enviar} disabled={enviando} size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            <MessageCircle className="mr-2 h-4 w-4" />
            {enviando ? "Generando…" : "Generar solicitud y continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
