import { useRef, useState } from 'react';
import { Download, FileImage, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { filasProveedor, tituloProveedor, type GarantiaProveedor } from '@/lib/garantia-proveedor';

export function ReporteProveedorGarantia({ garantia, colaborador }: { garantia: GarantiaProveedor; colaborador?: string | null }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const filename = `reporte-proveedor-${garantia.numero_garantia}.png`;
  async function preparar() {
    const element = ref.current;
    if (!element) return;
    setBusy(true);
    setBlob(null);
    try {
      await document.fonts.ready;
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: null, logging: false });
      const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo generar la imagen')), 'image/png'));
      setBlob(image);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo generar el reporte'); }
    finally { setBusy(false); }
  }
  async function descargar() {
    if (!blob) return;
    const file = new File([blob], filename, { type: 'image/png' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: tituloProveedor(garantia) }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  return <>
    <Button variant="outline" className="print:hidden" onClick={() => { setBlob(null); setOpen(true); }}>
      <FileImage className="mr-2 h-4 w-4" /> Generar reporte del proveedor
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl min-w-0 flex-col overflow-y-auto">
        <DialogHeader><DialogTitle>Reporte del proveedor</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button onClick={preparar} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />} Generar imagen</Button>
          {blob && <Button onClick={descargar}><Download className="mr-2 h-4 w-4" /> Descargar imagen</Button>}
        </div>
        <div className="max-h-[60dvh] min-h-0 min-w-0 w-full overflow-auto">
          <div ref={ref} className="warranty-supplier-report">
            <h2>{tituloProveedor(garantia)}</h2>
            <table><tbody>{filasProveedor(garantia, colaborador).map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}