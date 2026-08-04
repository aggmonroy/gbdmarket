import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadAsset } from "@/lib/uploads.functions";
import { toast } from "sonner";

interface Props {
  bucket?: "site-assets" | "product-images";
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ bucket = "site-assets", value, onChange, label = "Imagen" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = useServerFn(uploadAsset);

  async function pick(file: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10 MB");
      return;
    }
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = String(reader.result || "");
          resolve(s.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const { url } = await upload({
        data: { bucket, filename: file.name, contentType: file.type || "application/octet-stream", base64 },
      });
      onChange(url);
      toast.success("Imagen subida");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="preview" className="h-16 w-16 rounded object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded border grid place-items-center text-xs text-muted-foreground">Sin imagen</div>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Subiendo…" : value ? "Reemplazar" : "Subir"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-destructive hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
