import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Fuel, Loader2, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-cooperativa-gbd.png";
import {
  ORDEN_COMBUSTIBLE_DEFAULTS,
  ORDEN_COMBUSTIBLE_FIJO,
  fechaLarga,
  periodoFiscal,
  type OrdenCombustible,
} from "@/lib/orden-combustible";

const STORAGE_KEY = "gbd_formato_orden_combustible";
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Formato = "orden-combustible";

export function FormatosPanel() {
  const [formato, setFormato] = useState<Formato | null>(null);
  if (formato === "orden-combustible") return <OrdenCombustibleEditor onVolver={() => setFormato(null)} />;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Formatos</h2>
        <p className="text-sm text-muted-foreground">Formatos internos listos para completar, imprimir o descargar.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button type="button" onClick={() => setFormato("orden-combustible")} className="block w-full text-left">
          <Card className="h-full transition hover:border-primary hover:shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Fuel className="h-5 w-5 text-primary" /> Órdenes de combustible
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Orden de compra de combustible para la estación, con fecha, vehículo, placa y firmas editables.
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}

function OrdenCombustibleEditor({ onVolver }: { onVolver: () => void }) {
  const [datos, setDatos] = useState<OrdenCombustible>({ fecha: hoy(), ...ORDEN_COMBUSTIBLE_DEFAULTS });
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Recuerda vehículo, placa y firmas usados por última vez en este equipo.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDatos((d) => ({ ...d, ...JSON.parse(raw), fecha: d.fecha }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  useEffect(() => {
    const { fecha: _f, ...resto } = datos;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resto));
  }, [datos]);

  const set = (k: keyof OrdenCombustible) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [k]: e.target.value }));

  async function descargar() {
    const el = ref.current;
    if (!el) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#ffffff", logging: false });
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo generar la imagen"))), "image/png"),
      );
      const filename = `orden-combustible-${datos.fecha}-${datos.placa || "vehiculo"}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Orden de combustible" });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Formatos
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDatos({ fecha: hoy(), ...ORDEN_COMBUSTIBLE_DEFAULTS })}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
          </Button>
          <Button variant="outline" size="sm" onClick={descargar} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar imagen
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fuel className="h-5 w-5 text-primary" /> Orden de combustible
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Campo label="Fecha">
            <Input type="date" value={datos.fecha} onChange={set("fecha")} />
          </Campo>
          <Campo label="Vehículo">
            <Input value={datos.vehiculo} onChange={set("vehiculo")} placeholder="Ej. FRONTIER" />
          </Campo>
          <Campo label="Placa Nº">
            <Input value={datos.placa} onChange={set("placa")} placeholder="Ej. 913951" />
          </Campo>
          <Campo label="Preparado por">
            <Input value={datos.preparadoPor} onChange={set("preparadoPor")} />
          </Campo>
          <Campo label="Conductor">
            <Input value={datos.conductor} onChange={set("conductor")} />
          </Campo>
          <Campo label="Autorizado por">
            <Input value={datos.autorizadoPor} onChange={set("autorizadoPor")} />
          </Campo>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Se imprimen dos copias por hoja. El Nº de orden corresponde al periodo fiscal (agosto–julio) de la fecha.
          </p>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border border-border bg-background p-2 print:overflow-visible print:border-0 print:p-0">
        <div ref={ref} className="fuel-order-sheet">
          <OrdenCopia datos={datos} />
          <OrdenCopia datos={datos} />
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function OrdenCopia({ datos }: { datos: OrdenCombustible }) {
  return (
    <div className="fuel-order">
      <div className="fuel-order__head">
        <img src={logo} alt="Cooperativa GBD" />
        <div>
          <div>Cooperativa de Servicios Integrales</div>
          <div className="fuel-order__name">GLADYS B. DE DUCASA, R.L.</div>
          <div>Teléfonos: {ORDEN_COMBUSTIBLE_FIJO.telefonos}</div>
        </div>
      </div>
      <table>
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "32%" }} />
          <col style={{ width: "34%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={2} className="l">
              Orden de Compra <b>Nº</b>
            </td>
            <td className="b">{periodoFiscal(datos.fecha)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="b big">{fechaLarga(datos.fecha)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="l fuel-order__body">
              <div>
                Señores: <b>{ORDEN_COMBUSTIBLE_FIJO.estacion}</b>
              </div>
              <div>Sírvase despachar por cuenta de nuestra empresa</div>
            </td>
          </tr>
          <tr>
            <td>tanque lleno de:</td>
            <td className="b big">{ORDEN_COMBUSTIBLE_FIJO.combustible}</td>
            <td className="l">para el vehículo</td>
          </tr>
          <tr>
            <td className="b big">{datos.vehiculo}</td>
            <td className="b big">con placa Nº</td>
            <td className="b big">{datos.placa}</td>
          </tr>
          <tr className="blank">
            <td colSpan={3} />
          </tr>
          <tr>
            <td className="b">CANTIDAD</td>
            <td className="b">P.UNITARIO</td>
            <td className="b">P.TOTAL</td>
          </tr>
          <tr className="blank">
            <td />
            <td />
            <td />
          </tr>
          <tr>
            <td colSpan={3} className="l fuel-order__note">
              <b>Nota:</b> no se pagarán cuentas que no estén respaldadas con orden de compra debidamente autorizada.
            </td>
          </tr>
          <tr className="blank">
            <td />
            <td />
            <td />
          </tr>
          <tr>
            <td className="b big">Preparado por:</td>
            <td className="b big">Conductor</td>
            <td className="b big">Autorizado por:</td>
          </tr>
          <tr>
            <td className="b">{datos.preparadoPor}</td>
            <td className="b">{datos.conductor}</td>
            <td className="b">{datos.autorizadoPor}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
