import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Paperclip, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataConsent } from "@/components/site/DataConsent";
import { uploadPublicAttachment } from "@/lib/uploads.functions";
import { contentTypeForFile, fileToBase64, formatFileSize, PUBLIC_ATTACHMENT_MAX_BYTES } from "@/lib/file-upload-client";

export type ContactoCanal = {
  title: string;
  wa: string;
  horario: string;
  permiteAdjunto?: boolean;
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
  const [archivo, setArchivo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const upload = useServerFn(uploadPublicAttachment);

  const enviar = async () => {
    if (!canal) return;
    if (nombre.trim().length < 2) return toast.error("Ingresa tu nombre");
    if (cedula.trim().length < 4) return toast.error("Ingresa tu número de cédula");
    if (consulta.trim().length < 3) return toast.error("Cuéntanos tu consulta");
    if (archivo && archivo.size > PUBLIC_ATTACHMENT_MAX_BYTES) return toast.error("El archivo no debe superar 24 MB");
    if (!consent) return toast.error("Debes aceptar el tratamiento de datos");
    // Abrir la pestaña dentro del gesto del usuario; los bloqueadores la
    // rechazan si se abre después de esperar la subida del adjunto.
    const waTab = window.open("", "_blank");
    setEnviando(true);
    try {
      let adjuntoUrl = "";
      if (archivo) {
        const base64 = await fileToBase64(archivo);
        const result = await upload({
          data: {
            folder: "contacto",
            filename: archivo.name,
            contentType: contentTypeForFile(archivo),
            base64,
          },
        });
        adjuntoUrl = result.url;
      }
      const texto = [
        `Hola, mi nombre es ${nombre.trim()} y mi número de cédula es ${cedula.trim()}. Quiero solicitar información acerca de ${consulta.trim()}`,
        adjuntoUrl ? `Archivo adjunto: ${adjuntoUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const waUrl = `https://wa.me/${canal.wa}?text=${encodeURIComponent(texto)}`;
      if (waTab) {
        waTab.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
      onOpenChange(false);
      setNombre("");
      setCedula("");
      setConsulta("");
      setArchivo(null);
      setConsent(false);
    } catch (e: any) {
      waTab?.close();
      toast.error(e?.message ?? "No se pudo subir el archivo");
    } finally {
      setEnviando(false);
    }
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
          {canal?.permiteAdjunto && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm transition hover:bg-muted/70">
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Paperclip className="h-4 w-4" /> Adjuntar archivo
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {archivo ? `${archivo.name} · ${formatFileSize(archivo.size)}` : "Imagen, PDF, Word o Excel · hasta 24 MB"}
                </span>
              </span>
              <Upload className="h-4 w-4 shrink-0 text-primary" />
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > PUBLIC_ATTACHMENT_MAX_BYTES) {
                    toast.error("El archivo no debe superar 24 MB");
                    e.target.value = "";
                    return;
                  }
                  setArchivo(file);
                }}
              />
            </label>
          )}
          <DataConsent accepted={consent} onChange={setConsent} id="contacto-consent" />
          <Button onClick={enviar} disabled={enviando} size="lg" className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            {enviando ? "Preparando…" : "Continuar a WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
