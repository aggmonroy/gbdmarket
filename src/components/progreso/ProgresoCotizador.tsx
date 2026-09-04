import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Image as ImageIcon, Pencil, Plus, Printer, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgresoProductoPicker, type ProductoPublico } from "./ProgresoProductoPicker";
import { ProgresoVistaCotizacion } from "./ProgresoVistaCotizacion";
import { ProgresoConvertirPedido } from "./ProgresoConvertirPedido";
import { descargarArchivo } from "@/lib/generar-imagen-gbd";
import {
  PUNTO_VENTA_PROGRESO,
  calcularProgreso,
  fmtGP,
  lineaProgresoVacia,
  siguienteNumeroProgreso,
  type ClienteProgreso,
  type LineaProgreso,
  type ReglasProgreso,
} from "@/lib/progreso";

/**
 * Cotizador independiente de El Progreso. Todo ocurre en el navegador: al
 * cerrar la cotización se borran los datos y el enlace temporal, así no
 * consumimos almacenamiento ni se mezcla con los pendientes de GBD Market.
 */
export function ProgresoCotizador() {
  const [lineas, setLineas] = useState<LineaProgreso[]>([lineaProgresoVacia()]);
  const [reglas, setReglas] = useState<ReglasProgreso>({ margenPct: "20", plazoTope: "12" });
  const [cliente, setCliente] = useState<ClienteProgreso>({ nombre: "", telefono: "" });
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [emitida, setEmitida] = useState<{ numero: string; fecha: string } | null>(null);
  const [enlace, setEnlace] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [convertir, setConvertir] = useState(false);
  const vistaRef = useRef<HTMLDivElement | null>(null);
  const enlaceRef = useRef<string | null>(null);

  const totales = calcularProgreso(lineas, reglas);

  const setLinea = (id: string, patch: Partial<LineaProgreso>) =>
    setLineas((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const elegirProducto = (id: string, p: ProductoPublico) =>
    setLinea(id, {
      nombre: p.name,
      modelo: p.model || p.code || "",
      descripcion: (p.description || "").replace(/\s+/g, " ").slice(0, 180),
      imagen: p.images?.[0] || "",
    });

  const emitir = () => {
    if (!totales.lineas.some((l) => l.subtotal > 0)) {
      toast.error("Coloca al menos un artículo con precio de etiqueta");
      return;
    }
    setEmitida({ numero: siguienteNumeroProgreso(), fecha: new Date().toLocaleDateString("es-PA") });
    setEnlace(null);
  };

  const cerrar = () => {
    if (enlace) URL.revokeObjectURL(enlace);
    enlaceRef.current = null;
    setEnlace(null);
    setEmitida(null);
  };

  const capturar = async () => {
    const node = vistaRef.current;
    if (!node) throw new Error("La vista de la cotización no está lista");
    // html2canvas-pro: soporta colores oklch del tema (html2canvas v1 falla).
    const html2canvas = (await import("html2canvas-pro")).default;
    return await html2canvas(node, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
  };

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const canvas = await capturar();
      await descargarArchivo(canvas.toDataURL("image/png", 1), `Cotizacion-${emitida?.numero ?? "GP"}.png`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar la imagen");
    } finally {
      setGenerando(false);
    }
  };

  const descargarPdf = async () => {
    setGenerando(true);
    try {
      const canvas = await capturar();
      const { default: JsPDF } = await import("jspdf");
      const pdf = new JsPDF({ unit: "pt", format: "letter" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      pdf.addImage(canvas.toDataURL("image/png", 1), "PNG", (pw - canvas.width * ratio) / 2, 16, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Cotizacion-${emitida?.numero ?? "GP"}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el PDF");
    } finally {
      setGenerando(false);
    }
  };

  /** Enlace temporal (vive solo mientras esta pestaña esté abierta). */
  const generarEnlace = async () => {
    setGenerando(true);
    try {
      const canvas = await capturar();
      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cotización ${emitida?.numero}</title><style>body{margin:0;background:#eef2f6;display:grid;place-items:start center;padding:16px;font-family:system-ui,sans-serif}img{max-width:100%;box-shadow:0 8px 30px rgba(0,0,0,.15);border-radius:8px}</style></head><body><img src="${canvas.toDataURL(
        "image/png",
        1
      )}" alt="Cotización ${emitida?.numero}"></body></html>`;
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      enlaceRef.current = url;
      setEnlace(url);
      toast.success("Enlace temporal listo. Se borra al cerrar la cotización.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el enlace");
    } finally {
      setGenerando(false);
    }
  };


  /** Envía el enlace de la cotización al WhatsApp del cliente. */
  const enviarPorWhatsApp = async () => {
    const tel = cliente.telefono.replace(/\D/g, "");
    if (tel.length < 7) {
      toast.error("Coloca el WhatsApp del cliente para enviarle el enlace");
      return;
    }
    let url = enlace;
    if (!url) {
      await generarEnlace();
      url = enlaceRef.current;
    }
    const destino = tel.startsWith("507") ? tel : `507${tel}`;
    const texto = `Cotización ${emitida?.numero} · ${PUNTO_VENTA_PROGRESO.nombre}\nTotal al contado: ${fmtGP(
      totales.totalContado
    )}\nTotal a crédito: ${fmtGP(totales.totalCredito)}${url ? `\n\nVer cotización: ${url}` : ""}`;
    window.open(`https://wa.me/${destino}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (emitida)
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={descargarImagen} disabled={generando}>
            <ImageIcon className="mr-2 h-4 w-4" /> Descargar imagen
          </Button>
          <Button variant="outline" onClick={descargarPdf} disabled={generando}>
            <Printer className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
          <Button variant="outline" onClick={generarEnlace} disabled={generando}>
            <Download className="mr-2 h-4 w-4" /> Generar enlace
          </Button>
          <Button variant="outline" onClick={enviarPorWhatsApp} disabled={generando}>
            Enviar por WhatsApp
          </Button>
          <Button variant="secondary" onClick={() => setConvertir(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Convertir a pedido
          </Button>
          <Button variant="outline" onClick={() => setEmitida(null)}>
            <Pencil className="mr-2 h-4 w-4" /> Modificar cotización
          </Button>
          <Button variant="ghost" onClick={cerrar}>
            <X className="mr-2 h-4 w-4" /> Cerrar y borrar
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Vista de asesor · Margen {reglas.margenPct}% · Tope de plazo {reglas.plazoTope} meses. El cliente no ve estos datos.
        </div>

        <ProgresoConvertirPedido
          lineas={lineas}
          numero={emitida.numero}
          open={convertir}
          onOpenChange={setConvertir}
        />


        {enlace && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs">
            <a href={enlace} target="_blank" rel="noreferrer" className="truncate font-mono text-primary underline">
              {enlace}
            </a>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(enlace);
                toast.success("Enlace copiado");
              }}
            >
              <Copy className="mr-1 h-3 w-3" /> Copiar
            </Button>
            <span className="text-muted-foreground">Enlace temporal: desaparece al cerrar la cotización.</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <ProgresoVistaCotizacion
            numero={emitida.numero}
            fecha={emitida.fecha}
            cliente={cliente}
            totales={totales}
            refNode={(el) => (vistaRef.current = el)}
          />
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Reglas de El Progreso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="margen">Margen de crédito (%)</Label>
            <Input
              id="margen"
              inputMode="decimal"
              value={reglas.margenPct}
              onChange={(e) => setReglas((r) => ({ ...r, margenPct: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plazo">Tope de plazo (meses)</Label>
            <Input
              id="plazo"
              inputMode="numeric"
              value={reglas.plazoTope}
              onChange={(e) => setReglas((r) => ({ ...r, plazoTope: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Cliente (opcional, no se guarda)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cnombre">Nombre</Label>
            <Input id="cnombre" value={cliente.nombre} onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ctel">WhatsApp</Label>
            <Input id="ctel" value={cliente.telefono} onChange={(e) => setCliente((c) => ({ ...c, telefono: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {lineas.map((l, i) => (
        <Card key={l.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-display text-base">Artículo {i + 1}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPickerFor(l.id)}>
                <Search className="mr-1 h-3 w-3" /> Catálogo
              </Button>
              {lineas.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setLineas((ls) => ls.filter((x) => x.id !== l.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Detalle (nombre del artículo)</Label>
              <Input value={l.nombre} onChange={(e) => setLinea(l.id, { nombre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Input value={l.modelo} onChange={(e) => setLinea(l.id, { modelo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Cantidad</Label>
              <Input inputMode="numeric" value={l.cantidad} onChange={(e) => setLinea(l.id, { cantidad: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Precio de etiqueta El Progreso (B/.)</Label>
              <Input
                inputMode="decimal"
                value={l.precioEtiqueta}
                onChange={(e) => setLinea(l.id, { precioEtiqueta: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción corta</Label>
              <Input value={l.descripcion} onChange={(e) => setLinea(l.id, { descripcion: e.target.value })} />
            </div>
            {l.imagen && (
              <img src={l.imagen} alt={l.nombre} className="h-16 w-16 rounded-md border border-border object-cover" />
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setLineas((ls) => [...ls, lineaProgresoVacia()])}>
          <Plus className="mr-2 h-4 w-4" /> Agregar artículo
        </Button>
        <div className="text-sm text-muted-foreground">
          Contado {fmtGP(totales.totalContado)} · Crédito {fmtGP(totales.totalCredito)}
        </div>
        <Button onClick={emitir}>Generar cotización G&amp;P</Button>
      </div>

      <ProgresoProductoPicker
        open={!!pickerFor}
        onOpenChange={(o) => !o && setPickerFor(null)}
        onElegir={(p) => pickerFor && elegirProducto(pickerFor, p)}
      />
    </div>
  );
}
