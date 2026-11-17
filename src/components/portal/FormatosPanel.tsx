import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calculator,
  Clock,
  Contact,
  FileSignature,
  Download,
  FolderOpen,
  Fuel,
  KeyRound,
  Loader2,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCheck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-cooperativa-gbd.png";
import {
  ESTACIONES,
  ORDEN_COMBUSTIBLE_FIJO,
  fechaLarga,
  periodoFiscal,
  type EstacionConfig,
  type EstacionId,
  type OrdenCombustible,
} from "@/lib/orden-combustible";
import { ArqueoEditor } from "./formatos/arqueo";
import { PedidoEditor } from "./formatos/pedido";
import { TrasladoEditor } from "./formatos/traslado";
import { DocumentosEditor } from "./formatos/documentos";
import { RetirosEditor } from "./formatos/retiros";
import { HorasEditor } from "./formatos/horas";
import { CambiosEditor, RolesEditor } from "./formatos/solicitudes";
import { ApcEditor, DatosClienteEditor, DatosPersonalesEditor, DeclaracionIngresosEditor } from "./formatos/requisitos";
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Formato =
  | "el-esfuerzo"
  | "el-progreso"
  | "declaracion-ingresos"
  | "apc"
  | "datos-personales"
  | "datos-cliente"
  | "arqueo-caja"
  | "arqueo-caja-menuda"
  | "pedido"
  | "traslado-linea-blanca"
  | "traslado-progreso"
  | "documentos"
  | "retiros"
  | "horas"
  | "roles"
  | "cambios";

const FORMATOS: { id: Formato; titulo: string; descripcion: string; icono: LucideIcon; grupo: string }[] = [
  { id: "arqueo-caja", titulo: "Arqueo de caja", descripcion: "Billetes, monedas, BAC, cheques, Yappy, ACH y anulación; resta el fondo y marca sobrante o faltante. Con fotos de comprobantes.", icono: Calculator, grupo: "Caja" },
  { id: "arqueo-caja-menuda", titulo: "Arqueo de caja menuda", descripcion: "Efectivo y comprobantes con fondo de 100. Con fotos de comprobantes de WhatsApp.", icono: Wallet, grupo: "Caja" },
  { id: "pedido", titulo: "Pedido a proveedor", descripcion: "Pedido con el proveedor escrito a mano, cantidades, modelos y total.", icono: ShoppingCart, grupo: "Mercancía" },
  { id: "traslado-linea-blanca", titulo: "Traslados de Línea Blanca", descripcion: "Envío y traslado de mercancía con sucursal de origen y de destino.", icono: ArrowRightLeft, grupo: "Mercancía" },
  { id: "traslado-progreso", titulo: "Envío a El Progreso", descripcion: "Mercancía y activo fijo al punto de venta Coop. El Progreso, con origen y destino.", icono: Truck, grupo: "Mercancía" },
  { id: "documentos", titulo: "Control de documentos", descripcion: "Documentos enviados y recibidos por cada licenciado y los devueltos a Línea Blanca.", icono: FolderOpen, grupo: "Administración" },
  { id: "retiros", titulo: "Consulta de retiros", descripcion: "Cédula, si es cliente de Línea Blanca y saldo.", icono: Search, grupo: "Administración" },
  { id: "horas", titulo: "Control de horas", descripcion: "Horas y tiempo aplicable por empleado; llegadas tarde en negativo.", icono: Clock, grupo: "Administración" },
  { id: "roles", titulo: "Solicitud de roles", descripcion: "Creación de usuario, asignación o baja de roles y correo.", icono: KeyRound, grupo: "Sistema" },
  { id: "cambios", titulo: "Solicitud de cambios en el sistema", descripcion: "Descripción y justificación del cambio, con aprobación.", icono: Wrench, grupo: "Sistema" },
  { id: "declaracion-ingresos", titulo: "Declaración de ingresos de independientes", descripcion: "Ingresos por actividad, costos y gastos; calcula ingresos brutos y ganancia neta. Admite sumas +10+10+10.", icono: FileSignature, grupo: "Requisitos de crédito" },
  { id: "apc", titulo: "Autorización de APC", descripcion: "Autorización de consulta en APC Buró y SVI del Tribunal Electoral; tres copias por hoja.", icono: ShieldCheck, grupo: "Requisitos de crédito" },
  { id: "datos-personales", titulo: "Autorización de uso de datos personales", descripcion: "Autorización según la Ley 81 de 2019, con lugar, fecha, nombre y cédula.", icono: UserCheck, grupo: "Requisitos de crédito" },
  { id: "datos-cliente", titulo: "Datos del cliente (Línea Blanca)", descripcion: "Contacto, dirección, lugar de trabajo, artículos con modelo y descripción, y desglose de pagos.", icono: Contact, grupo: "Requisitos de crédito" },
  { id: "el-esfuerzo", titulo: "Estación El Esfuerzo", descripcion: "Orden de combustible para la estación El Esfuerzo, con fecha, vehículo, placa y firmas editables.", icono: Fuel, grupo: "Combustible" },
  { id: "el-progreso", titulo: "Estación El Progreso", descripcion: "Orden de combustible para Cooperativa El Progreso, R.L. (Sección Línea Blanca), con fecha, vehículo, placa y firmas editables.", icono: Fuel, grupo: "Combustible" },
];

export function FormatosPanel() {
  const [formato, setFormato] = useState<Formato | null>(null);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [formato]);
  const volver = () => setFormato(null);
  switch (formato) {
    case "el-esfuerzo":
    case "el-progreso":
      return <OrdenCombustibleEditor key={formato} estacion={formato} onVolver={volver} />;
    case "declaracion-ingresos":
      return <DeclaracionIngresosEditor onVolver={volver} />;
    case "apc":
      return <ApcEditor onVolver={volver} />;
    case "datos-personales":
      return <DatosPersonalesEditor onVolver={volver} />;
    case "datos-cliente":
      return <DatosClienteEditor onVolver={volver} />;
    case "arqueo-caja":
      return <ArqueoEditor tipo="caja" onVolver={volver} />;
    case "arqueo-caja-menuda":
      return <ArqueoEditor tipo="caja-menuda" onVolver={volver} />;
    case "pedido":
      return <PedidoEditor onVolver={volver} />;
    case "traslado-linea-blanca":
      return <TrasladoEditor tipo="linea-blanca" onVolver={volver} />;
    case "traslado-progreso":
      return <TrasladoEditor tipo="progreso" onVolver={volver} />;
    case "documentos":
      return <DocumentosEditor onVolver={volver} />;
    case "retiros":
      return <RetirosEditor onVolver={volver} />;
    case "horas":
      return <HorasEditor onVolver={volver} />;
    case "roles":
      return <RolesEditor onVolver={volver} />;
    case "cambios":
      return <CambiosEditor onVolver={volver} />;
  }
  const grupos = Array.from(new Set(FORMATOS.map((f) => f.grupo)));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Formatos</h2>
        <p className="text-sm text-muted-foreground">
          Formatos internos listos para completar, imprimir o descargar. No se guardan en el sistema.
        </p>
      </div>
      {grupos.map((g) => (
        <section key={g} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FORMATOS.filter((f) => f.grupo === g).map((f) => (
              <button key={f.id} type="button" onClick={() => setFormato(f.id)} className="block w-full text-left">
                <Card className="h-full transition hover:border-primary hover:shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <f.icono className="h-5 w-5 text-primary" /> {f.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{f.descripcion}</CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OrdenCombustibleEditor({ estacion, onVolver }: { estacion: EstacionId; onVolver: () => void }) {
  const cfg = ESTACIONES[estacion];
  const STORAGE_KEY = cfg.storageKey;
  const [datos, setDatos] = useState<OrdenCombustible>({ fecha: hoy(), ...cfg.defaults });
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
  }, [STORAGE_KEY]);
  useEffect(() => {
    const { fecha: _f, ...resto } = datos;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resto));
  }, [STORAGE_KEY, datos]);

  const set = (k: keyof OrdenCombustible) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [k]: e.target.value }));

  /** Imprime solo el formato, en carta horizontal (dos copias por hoja). */
  function imprimir() {
    const root = document.documentElement;
    const style = document.createElement("style");
    style.textContent = "@page { size: letter landscape; margin: 10mm; }";
    document.head.appendChild(style);
    root.classList.add("print-fuel-order");
    const limpiar = () => {
      root.classList.remove("print-fuel-order");
      style.remove();
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    window.print();
  }

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
      const filename = `${cfg.archivo}-${datos.fecha}-${datos.placa || "vehiculo"}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: cfg.titulo });
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a formatos
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDatos({ fecha: hoy(), ...cfg.defaults })}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
          </Button>
          <Button variant="outline" size="sm" onClick={descargar} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar imagen
          </Button>
          <Button size="sm" onClick={imprimir}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fuel className="h-5 w-5 text-primary" /> {cfg.titulo}
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
            <Input value={datos.preparadoPor} onChange={set("preparadoPor")} placeholder={cfg.conductor ? undefined : "Colaborador"} />
          </Campo>
          {cfg.conductor && (
            <Campo label="Conductor">
              <Input value={datos.conductor} onChange={set("conductor")} />
            </Campo>
          )}
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
          <OrdenCopia datos={datos} cfg={cfg} />
          <OrdenCopia datos={datos} cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label className="block space-y-1 text-xs">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function OrdenCopia({ datos, cfg }: { datos: OrdenCombustible; cfg: EstacionConfig }) {
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
          {cfg.seccion && (
            <tr>
              <td colSpan={3} className="b">{cfg.seccion}</td>
            </tr>
          )}
          <tr>
            <td colSpan={3} className="l fuel-order__body">
              <div>
                Señores: <b>{cfg.estacion}</b>
              </div>
              <div>Sírvase despachar por cuenta de nuestra empresa</div>
            </td>
          </tr>
          <tr>
            <td>tanque lleno de:</td>
            <td className="b big">{cfg.combustible}</td>
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
            <td className="b big">{cfg.conductor ? "Conductor" : ""}</td>
            <td className="b big">Autorizado por:</td>
          </tr>
          <tr>
            <td className="b">{datos.preparadoPor}</td>
            <td className="b">{cfg.conductor ? datos.conductor : ""}</td>
            <td className="b">{datos.autorizadoPor}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
