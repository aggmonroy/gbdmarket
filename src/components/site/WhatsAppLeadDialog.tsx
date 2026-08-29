import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataConsent } from "@/components/site/DataConsent";
import { registrarContactoWhatsApp } from "@/lib/leads.functions";
import { buildWaUrl, type WaChannel } from "@/lib/whatsapp";
import { socioActivo } from "@/lib/socio";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  channel: WaChannel;
  /** Mensaje que se enviará por WhatsApp una vez registrados los datos. */
  mensaje: string;
  productId?: string | null;
  productName?: string | null;
};

/**
 * Antes de abrir WhatsApp pedimos nombre y teléfono para registrar la
 * interacción y generar su tarea pendiente de seguimiento.
 */
export function WhatsAppLeadDialog({ open, onOpenChange, channel, mensaje, productId, productName }: Props) {
  const registrar = useServerFn(registrarContactoWhatsApp);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const continuar = async () => {
    if (nombre.trim().length < 2) return toast.error("Ingresa tu nombre");
    if (telefono.trim().length < 6) return toast.error("Ingresa tu teléfono o WhatsApp");
    if (!consent) return toast.error("Debes aceptar el tratamiento de datos");
    setEnviando(true);
    const socio = channel === "bordados" ? null : socioActivo();
    if (socio) {
      // El seguimiento lo hace el socio aliado; no registramos el contacto de nuestro lado.
      const texto = [mensaje, `Nombre: ${nombre.trim()}`, `Tel: ${telefono.trim()}`, notas.trim() ? `Notas: ${notas.trim()}` : ""]
        .filter(Boolean)
        .join("\n");
      window.open(buildWaUrl(channel, texto), "_blank");
      onOpenChange(false);
      setNotas("");
      setConsent(false);
      setEnviando(false);
      return;
    }
    try {
      await registrar({
        data: {
          channel,
          customer_name: nombre.trim(),
          customer_phone: telefono.trim(),
          customer_email: email.trim(),
          product_id: productId ?? null,
          product_name: productName ?? "",
          notes: notas.trim(),
          consent: true,
        } as any,
      });
      const texto = [mensaje, `Nombre: ${nombre.trim()}`, `Tel: ${telefono.trim()}`, notas.trim() ? `Notas: ${notas.trim()}` : ""]
        .filter(Boolean)
        .join("\n");
      window.open(buildWaUrl(channel, texto), "_blank");
      onOpenChange(false);
      setNotas("");
      setConsent(false);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo registrar tu solicitud. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Antes de continuar</DialogTitle>
          <DialogDescription>
            Déjanos tus datos para darte seguimiento. Al continuar se abrirá WhatsApp con tu mensaje.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input placeholder="Tu nombre *" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Teléfono / WhatsApp *" maxLength={30} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <Input placeholder="Correo electrónico (opcional)" maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Textarea
            placeholder="¿En qué te ayudamos? (opcional)"
            rows={3}
            maxLength={1000}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <DataConsent accepted={consent} onChange={setConsent} id={`wa-consent-${channel}`} />
          <Button
            onClick={continuar}
            disabled={enviando}
            size="lg"
            className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {enviando ? "Registrando…" : "Continuar a WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
