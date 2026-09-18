import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataConsent } from "@/components/site/DataConsent";
import { uploadPublicAttachment } from "@/lib/uploads.functions";
import { contentTypeForFile, fileToBase64, formatFileSize, PUBLIC_ATTACHMENT_MAX_BYTES } from "@/lib/file-upload-client";

const WHATSAPP_YAPPY = "50767841941";

export function YappyPaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const upload = useServerFn(uploadPublicAttachment);

  const reset = () => {
    setNombre("");
    setCedula("");
    setCuenta("");
    setComprobante(null);
    setConsent(false);
  };

  const enviar = async () => {
    if (nombre.trim().length < 2) return toast.error("Ingresa el nombre del dueño de la cuenta");
    if (cedula.trim().length < 4) return toast.error("Ingresa el número de cédula");
    if (cuenta.trim().length < 4) return toast.error("Ingresa el número de cuenta");
    if (!comprobante) return toast.error("Sube la imagen del comprobante de pago");
    if (comprobante.size > PUBLIC_ATTACHMENT_MAX_BYTES) return toast.error("La imagen no debe superar 24 MB");
    if (!consent) return toast.error("Debes aceptar el tratamiento de datos");

    setEnviando(true);
    try {
      const result = await upload({
        data: {
          folder: "yappy",
          filename: comprobante.name,
          contentType: contentTypeForFile(comprobante),
          base64: await fileToBase64(comprobante),
        },
      });
      const texto = [
        "Registro de pago por Yappy",
        `Nombre del dueño de la cuenta: ${nombre.trim()}`,
        `Cédula: ${cedula.trim()}`,
        `Número de cuenta: ${cuenta.trim()}`,
        `Comprobante de pago: ${result.url}`,
      ].join("\n");
      window.open(`https://wa.me/${WHATSAPP_YAPPY}?text=${encodeURIComponent(texto)}`, "_blank");
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo enviar el comprobante");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Registrar pago por Yappy</DialogTitle>
          <DialogDescription>
            Completa los datos y sube el comprobante para enviarlo por WhatsApp a Mueblería GBD Las Tablas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input placeholder="Nombre del dueño de la cuenta *" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Número de cédula *" maxLength={30} value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <Input placeholder="Número de cuenta *" maxLength={60} value={cuenta} onChange={(e) => setCuenta(e.target.value)} />
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm transition hover:bg-muted/70">
            <span className="min-w-0">
              <span className="font-semibold text-foreground">Comprobante de pago *</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {comprobante ? `${comprobante.name} · ${formatFileSize(comprobante.size)}` : "Sube una imagen en alta resolución · hasta 24 MB"}
              </span>
            </span>
            <Upload className="h-4 w-4 shrink-0 text-primary" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > PUBLIC_ATTACHMENT_MAX_BYTES) {
                  toast.error("La imagen no debe superar 24 MB");
                  e.target.value = "";
                  return;
                }
                setComprobante(file);
              }}
            />
          </label>
          <DataConsent accepted={consent} onChange={setConsent} id="yappy-payment-consent" />
          <Button onClick={enviar} disabled={enviando} size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            {enviando ? "Preparando envío…" : "Enviar registro por WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}