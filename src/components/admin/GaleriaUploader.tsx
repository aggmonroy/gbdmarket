import { useRef, useState } from "react";
import { Upload, Loader2, X, FileText } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadAsset } from "@/lib/uploads.functions";
import { toast } from "sonner";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB por archivo

function aBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Sube varias imágenes grandes al catálogo y devuelve sus URLs. */
export function GaleriaUploader({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = useServerFn(uploadAsset);

  async function subir(files: File[]) {
    setBusy(true);
    const nuevas: string[] = [];
    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: máximo 25 MB`);
          continue;
        }
        const base64 = await aBase64(file);
        const { url } = await upload({
          data: {
            bucket: "product-images",
            filename: file.name,
            contentType: file.type || "image/jpeg",
            base64,
          },
        });
        nuevas.push(url);
      }
      if (nuevas.length) {
        onChange([...urls, ...nuevas]);
        toast.success(`${nuevas.length} imagen(es) subida(s)`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="relative h-20 w-20 overflow-hidden rounded border border-border">
            <img src={u} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Quitar imagen"
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              className="absolute right-0 top-0 bg-background/80 p-0.5 text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="grid h-20 w-20 place-items-center rounded border border-dashed border-border text-muted-foreground hover:bg-accent"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · hasta 25 MB por imagen · puedes seleccionar varias a la vez</p>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) subir(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Sube un documento (catálogo PDF del proveedor, ficha técnica, manual). */
export function DocumentoUploader({
  value,
  onChange,
  label = "Documento",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState<string>("");
  const upload = useServerFn(uploadAsset);

  async function subir(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Máximo 25 MB");
      return;
    }
    setBusy(true);
    try {
      const base64 = await aBase64(file);
      const { url } = await upload({
        data: {
          bucket: "site-assets",
          filename: file.name,
          contentType: file.type || "application/pdf",
          base64,
        },
      });
      setNombre(file.name);
      onChange(url);
      toast.success("Documento subido");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {busy ? "Subiendo…" : value ? "Reemplazar PDF" : `Subir ${label}`}
        </button>
        {value && (
          <>
            <a href={value} target="_blank" rel="noreferrer" className="text-sm underline">
              Ver {nombre || "documento"}
            </a>
            <button type="button" onClick={() => onChange("")} className="text-sm text-destructive hover:underline">
              Quitar
            </button>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) subir(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
