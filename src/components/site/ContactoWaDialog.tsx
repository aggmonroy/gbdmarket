import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataConsent } from "@/components/site/DataConsent";

export type ContactoCanal = {
  title: string;
  wa: string;
  horario: string;
};

export function ContactoWaDialog({
  canal,
  onOpenChange,
}: {
  canal: ContactoCanal | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [consulta, setConsulta] = useState("");
  const [consent, setConsent] = useState(false);

  const enviar = () => {
    if (!canal) return;
    if (nombre.trim().length < 2) return toast.error("Ingresa tu nombre");
    if (cedula.trim().length < 4) return toast.error("Ingresa tu número de cédula");
    if (consulta.trim().length < 3) return toast.error("Cuéntanos tu consulta");
    if (!consent) return toast.error("Debes aceptar el tratamiento de datos");
    const texto = `Hola, mi nombre es ${nombre.trim()} y mi número de cédula es ${cedula.trim()}. Quiero solicitar información acerca de ${consulta.trim()}`;
    window.open(`https://wa.me/${canal.wa}?text=${encodeURIComponent(texto)}`, "_blank");
    onOpenChange(false);
    setNombre("");
    setCedula("");
    setConsulta("");
    setConsent(false);
  };

  return (
    <Dialog open={!!canal} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{canal?.title}</DialogTitle>
          <DialogDescription>
            Horario de atención: {canal?.horario}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input placeholder="Nombre completo *" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Número de cédula *" maxLength={30} value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <Textarea
            placeholder="¿Sobre qué deseas información? *"
            rows={3}
            maxLength={1000}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />
          <DataConsent accepted={consent} onChange={setConsent} id="contacto-consent" />
          <Button onClick={enviar} size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            Continuar a WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
