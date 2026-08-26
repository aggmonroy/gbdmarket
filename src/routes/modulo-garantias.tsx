import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  agregarSeguimiento,
  crearGarantia,
  getGarantia,
  listBitacoraCerradas,
  listGarantiasAbiertas,
  listSolicitudesCierre,
  misTareasPendientes,
  numeroGarantiaPreview,
  rechazarCierre,
  reporteTokenGarantia,
  solicitarCierre,
  subirEvidencia,
  validarCierre,
} from "@/lib/garantias.functions";
import {
  ESTADO_LABEL,
  VIAS,
  calcularAntiguedad,
  descargarArchivo,
  siguientePaso,
  toCsv,
  type GarantiaEstado,
} from "@/lib/garantias-shared";

export const Route = createFileRoute("/modulo-garantias")({
  head: () => ({
    meta: [
      { title: "Módulo de trámite de garantías · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Registro, seguimiento y cierre de trámites de garantía de Cooperativa GBD." },
    ],
  }),
  component: ModuloGarantias,
});

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

const KEY = "gbd_garantias_sesion";
const hoy = () => new Date().toISOString().slice(0, 10);

function useSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (raw) {
      try {
        setSesion(JSON.parse(raw));
      } catch {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
      }
    }
    setListo(true);
  }, []);
  const salir = () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setSesion(null);
  };
  return { sesion, listo, salir };
}

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  buf.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function ModuloGarantias() {
  const { sesion, listo, salir } = useSesion();
  if (!listo) return null;
  if (!sesion) return <SinSesion />;
  return <Panel sesion={sesion} onSalir={salir} />;
}

/* ------------------------- Sin sesión: entrar por Colaboradores ------------------------- */

function SinSesion() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <KeyRound className="h-5 w-5 text-primary" />
            Trámite de garantías
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            El ingreso y el cambio de PIN se realizan desde el acceso de Colaboradores.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/portal">Ir al acceso de Colaboradores</Link>
          </Button>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">
            Volver al sitio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------- Panel ---------------------------------- */

function Panel({ sesion, onSalir }: { sesion: Sesion; onSalir: () => void }) {
  const token = sesion.token;
  const esAdmin = sesion.colaborador.rol === "admin";
  const esGerente = sesion.colaborador.rol === "gerente";
  const qc = useQueryClient();

  const abiertasFn = useServerFn(listGarantiasAbiertas);
  const cerradasFn = useServerFn(listBitacoraCerradas);
  const solicitudesFn = useServerFn(listSolicitudesCierre);
  const tareasFn = useServerFn(misTareasPendientes);

  const { data: abiertas = [] } = useQuery({
    queryKey: ["gar-abiertas"],
    queryFn: () => abiertasFn({ data: { token } }) as any,
  });
  const { data: cerradas = [] } = useQuery({
    queryKey: ["gar-cerradas"],
    queryFn: () => cerradasFn({ data: { token } }) as any,
    enabled: !esGerente,
  });
  const { data: solicitudes = [] } = useQuery({
    queryKey: ["gar-solicitudes"],
    queryFn: () => solicitudesFn({ data: { token } }) as any,
    enabled: esAdmin,
  });
  const { data: tareas = [] } = useQuery({
    queryKey: ["gar-tareas"],
    queryFn: () => tareasFn({ data: { token } }) as any,
  });

  const [detalle, setDetalle] = useState<string | null>(null);
  const refrescar = () => qc.invalidateQueries();

  const alertas = (abiertas as any[]).filter(
    (g) => calcularAntiguedad(g.fecha, g.ultimo_contacto).enAlerta,
  ).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="font-display font-bold">Trámite de garantías</div>
            <div className="text-xs text-muted-foreground">
              {sesion.colaborador.nombre} · {sesion.colaborador.rol}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alertas > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {alertas} sin contacto
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onSalir}>
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue={esGerente ? "activos" : "nuevo"}>
          <TabsList className="flex-wrap">
            {!esGerente && <TabsTrigger value="nuevo">Nuevo caso</TabsTrigger>}
            <TabsTrigger value="activos">Casos activos ({(abiertas as any[]).length})</TabsTrigger>
            {esAdmin && <TabsTrigger value="validar">Por validar ({(solicitudes as any[]).length})</TabsTrigger>}
            {!esGerente && <TabsTrigger value="bitacora">Bitácora</TabsTrigger>}
            <TabsTrigger value="tareas">Mis tareas ({(tareas as any[]).length})</TabsTrigger>
          </TabsList>

          {!esGerente && (
            <TabsContent value="nuevo" className="mt-6">
              <FormularioNuevo token={token} onCreada={refrescar} />
            </TabsContent>
          )}

          <TabsContent value="activos" className="mt-6">
            <ListaCasos casos={abiertas as any[]} onAbrir={setDetalle} />
          </TabsContent>

          {esAdmin && (
            <TabsContent value="validar" className="mt-6 space-y-3">
              {(solicitudes as any[]).length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cierres pendientes de validación.</p>
              )}
              {(solicitudes as any[]).map((s) => (
                <SolicitudCierre key={s.id} solicitud={s} token={token} onResuelta={refrescar} onAbrir={setDetalle} />
              ))}
            </TabsContent>
          )}

          {!esGerente && (
            <TabsContent value="bitacora" className="mt-6">
              <Bitacora casos={cerradas as any[]} onAbrir={setDetalle} />
            </TabsContent>
          )}

          <TabsContent value="tareas" className="mt-6 space-y-3">
            {(tareas as any[]).length === 0 && <p className="text-sm text-muted-foreground">Sin tareas pendientes.</p>}
            {(tareas as any[]).map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <div className="font-medium">{t.titulo}</div>
                    <div className="text-xs text-muted-foreground">{t.descripcion}</div>
                  </div>
                  {t.garantia_id && (
                    <Button variant="outline" size="sm" onClick={() => setDetalle(t.garantia_id)}>
                      Abrir caso
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {detalle && (
        <DetalleCaso
          id={detalle}
          token={token}
          rol={sesion.colaborador.rol}
          onClose={() => setDetalle(null)}
          onCambio={refrescar}
        />
      )}
    </div>
  );
}

/* ------------------------------- Nuevo caso ------------------------------- */

const vacio = {
  fecha: hoy(),
  cliente: "",
  cedula_cliente: "",
  telefono_cliente: "",
  direccion_cliente: "",
  numero_factura: "",
  fecha_facturacion: "",
  modelo_codigo: "",
  descripcion_articulo: "",
  dentro_15_dias: false,
  no_mal_uso: false,
  accion_realizada: "",
};

function FormularioNuevo({ token, onCreada }: { token: string; onCreada: () => void }) {
  const [form, setForm] = useState({ ...vacio });
  const [pin, setPin] = useState("");
  const previewFn = useServerFn(numeroGarantiaPreview);
  const crearFn = useServerFn(crearGarantia);

  const { data: numero } = useQuery({
    queryKey: ["gar-numero", form.fecha],
    queryFn: () => previewFn({ data: { token, fecha: form.fecha } }) as any,
  });

  const set = (k: keyof typeof vacio, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const crear = useMutation({
    mutationFn: () => crearFn({ data: { token, pin, ...form } }) as any,
    onSuccess: (r: any) => {
      toast.success(`Garantía ${r.numero_garantia} registrada`);
      setForm({ ...vacio });
      setPin("");
      onCreada();
      // Se abre el reporte imprimible con enlace firmado: no vuelve a pedir PIN.
      window.open(`/reporte-garantia/${r.id}?t=${encodeURIComponent(r.reporte_token)}`, "_blank");
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo registrar"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="h-5 w-5 text-primary" /> Nuevo trámite de garantía
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Número asignado: <span className="font-mono font-semibold">{numero ?? "…"}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Fecha del trámite">
            <Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
          </Campo>
          <Campo label="Cliente">
            <Input value={form.cliente} onChange={(e) => set("cliente", e.target.value)} />
          </Campo>
          <Campo label="Cédula">
            <Input value={form.cedula_cliente} onChange={(e) => set("cedula_cliente", e.target.value)} />
          </Campo>
          <Campo label="Teléfono">
            <Input value={form.telefono_cliente} onChange={(e) => set("telefono_cliente", e.target.value)} />
          </Campo>
          <Campo label="Número de factura">
            <Input value={form.numero_factura} onChange={(e) => set("numero_factura", e.target.value)} />
          </Campo>
          <Campo label="Fecha de facturación">
            <Input type="date" value={form.fecha_facturacion} onChange={(e) => set("fecha_facturacion", e.target.value)} />
          </Campo>
          <Campo label="Modelo / código">
            <Input value={form.modelo_codigo} onChange={(e) => set("modelo_codigo", e.target.value)} />
          </Campo>
        </div>

        <Campo label="Descripción del artículo y del desperfecto">
          <Textarea
            rows={3}
            value={form.descripcion_articulo}
            onChange={(e) => set("descripcion_articulo", e.target.value)}
          />
        </Campo>

        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.dentro_15_dias}
              onCheckedChange={(v) => setForm((f) => ({ ...f, dentro_15_dias: !!v, no_mal_uso: v ? f.no_mal_uso : false }))}
            />
            El artículo está dentro de los primeros 15 días posteriores a la compra
          </label>
          {form.dentro_15_dias && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.no_mal_uso} onCheckedChange={(v) => set("no_mal_uso", !!v)} />
              El examen físico y visual descarta mal uso
            </label>
          )}
          <p className="text-xs text-muted-foreground">
            <strong>Siguiente paso:</strong> {siguientePaso(form.dentro_15_dias, form.no_mal_uso)}
          </p>
        </div>

        <Campo label="Acción realizada">
          <Textarea rows={3} value={form.accion_realizada} onChange={(e) => set("accion_realizada", e.target.value)} />
        </Campo>

        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <Campo label="Confirma tu PIN para firmar el registro">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-28"
              placeholder="••••"
            />
          </Campo>
          <Button disabled={!form.cliente || pin.length !== 4 || crear.isPending} onClick={() => crear.mutate()}>
            {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar garantía
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* --------------------------------- Listas --------------------------------- */

function EstadoBadge({ estado }: { estado: GarantiaEstado }) {
  const variante = estado === "revision" ? "secondary" : estado === "proceso" ? "default" : "outline";
  return <Badge variant={variante as any}>{ESTADO_LABEL[estado]}</Badge>;
}

function ListaCasos({ casos, onAbrir }: { casos: any[]; onAbrir: (id: string) => void }) {
  if (!casos.length) return <p className="text-sm text-muted-foreground">No hay casos activos.</p>;
  return (
    <div className="space-y-3">
      {casos.map((g) => {
        const a = calcularAntiguedad(g.fecha, g.ultimo_contacto);
        return (
          <Card key={g.id} className={a.enAlerta ? "border-destructive/60" : undefined}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{g.numero_garantia}</span>
                  <EstadoBadge estado={g.estado} />
                  {a.enAlerta && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> {a.diasSinContacto} días sin contacto
                    </Badge>
                  )}
                </div>
                <div className="mt-1 truncate text-sm">{g.cliente}</div>
                <div className="text-xs text-muted-foreground">
                  {g.descripcion_articulo || "Sin descripción"} · {g.total_seguimientos} seguimiento(s) · abierta hace{" "}
                  {a.diasAbierta} días · {g.tramitado_por_nombre}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onAbrir(g.id)}>
                  Ver caso
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Bitacora({ casos, onAbrir }: { casos: any[]; onAbrir: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtrados = useMemo(
    () =>
      casos.filter((g) =>
        [g.numero_garantia, g.cliente, g.numero_factura, g.modelo_codigo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [casos, q],
  );

  function exportar() {
    const csv = toCsv(
      ["Número", "Fecha", "Cliente", "Artículo", "Factura", "Estado", "Fecha de cierre", "Tramitado por"],
      filtrados.map((g) => [
        g.numero_garantia,
        g.fecha,
        g.cliente,
        g.descripcion_articulo,
        g.numero_factura,
        ESTADO_LABEL[g.estado as GarantiaEstado],
        g.fecha_cierre,
        g.tramitado_por_nombre,
      ]),
    );
    descargarArchivo(`garantias-cerradas-${hoy()}.csv`, csv);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar por número, cliente o factura" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={exportar} disabled={!filtrados.length}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      {!filtrados.length && <p className="text-sm text-muted-foreground">Sin casos cerrados.</p>}
      {filtrados.map((g) => (
        <Card key={g.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{g.numero_garantia}</span>
                <EstadoBadge estado={g.estado} />
              </div>
              <div className="text-sm">{g.cliente}</div>
              <div className="text-xs text-muted-foreground">Cerrada el {g.fecha_cierre ?? "—"}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onAbrir(g.id)}>
              Ver caso
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SolicitudCierre({
  solicitud,
  token,
  onResuelta,
  onAbrir,
}: {
  solicitud: any;
  token: string;
  onResuelta: () => void;
  onAbrir: (id: string) => void;
}) {
  const validarFn = useServerFn(validarCierre);
  const rechazarFn = useServerFn(rechazarCierre);
  const accion = useMutation({
    mutationFn: (aprobar: boolean) =>
      (aprobar ? validarFn : rechazarFn)({ data: { token, garantia_id: solicitud.garantia_id } }) as any,
    onSuccess: (_d, aprobar) => {
      toast.success(aprobar ? "Cierre validado" : "Cierre devuelto a proceso");
      onResuelta();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo procesar"),
  });

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <div className="font-mono text-sm font-semibold">{solicitud.garantia?.numero_garantia}</div>
          <div className="text-sm">{solicitud.garantia?.cliente}</div>
          <div className="text-xs text-muted-foreground">
            Propuesto: {ESTADO_LABEL[solicitud.tipo_propuesto as GarantiaEstado]} · por {solicitud.solicitado_por_nombre}
          </div>
          {solicitud.nota_final && <p className="mt-1 max-w-xl text-xs">{solicitud.nota_final}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onAbrir(solicitud.garantia_id)}>
            Ver caso
          </Button>
          <Button variant="ghost" size="sm" disabled={accion.isPending} onClick={() => accion.mutate(false)}>
            Devolver
          </Button>
          <Button size="sm" disabled={accion.isPending} onClick={() => accion.mutate(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Validar cierre
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Detalle caso ------------------------------- */

function DetalleCaso({
  id,
  token,
  rol,
  onClose,
  onCambio,
}: {
  id: string;
  token: string;
  rol: string;
  onClose: () => void;
  onCambio: () => void;
}) {
  const getFn = useServerFn(getGarantia);
  const segFn = useServerFn(agregarSeguimiento);
  const evFn = useServerFn(subirEvidencia);
  const cierreFn = useServerFn(solicitarCierre);
  const soloLectura = rol === "gerente";

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["gar-detalle", id],
    queryFn: () => getFn({ data: { token, garantia_id: id } }) as any,
  });

  const rtokenFn = useServerFn(reporteTokenGarantia);
  const { data: rtoken } = useQuery({
    queryKey: ["reporte-token", id],
    queryFn: () => rtokenFn({ data: { token, garantia_id: id } }) as any,
  });

  const [texto, setTexto] = useState("");
  const [via, setVia] = useState<string>("Llamada");
  const [fecha, setFecha] = useState(hoy());
  const [tipoCierre, setTipoCierre] = useState("cerrada_cliente_credito");
  const [notaFinal, setNotaFinal] = useState("");
  const [documento, setDocumento] = useState("");

  const nuevoSeg = useMutation({
    mutationFn: () => segFn({ data: { token, garantia_id: id, fecha, via: via as any, texto } }) as any,
    onSuccess: (r: any) => {
      setTexto("");
      toast.success("Seguimiento agregado");
      refetch();
      onCambio();
      if (r?.reporte_token)
        window.open(`/reporte-garantia/${id}?t=${encodeURIComponent(r.reporte_token)}`, "_blank");
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo agregar"),
  });

  const nuevaEv = useMutation({
    mutationFn: async (file: File) =>
      evFn({
        data: { token, garantia_id: id, filename: file.name, contentType: file.type || "image/jpeg", base64: await fileToBase64(file) },
      }) as any,
    onSuccess: () => {
      toast.success("Evidencia adjuntada");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo subir la imagen"),
  });

  const pedirCierre = useMutation({
    mutationFn: () =>
      cierreFn({
        data: {
          token,
          garantia_id: id,
          tipo_propuesto: tipoCierre as any,
          nota_final: notaFinal,
          numero_documento_subsanacion: documento,
        },
      }) as any,
    onSuccess: () => {
      toast.success("Cierre enviado a validación del administrador");
      refetch();
      onCambio();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo solicitar el cierre"),
  });

  const g = data?.garantia;
  const antig = g ? calcularAntiguedad(g.fecha, data.seguimientos.at(-1)?.fecha ?? null) : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {g?.numero_garantia ?? "Cargando…"}
            {g && <EstadoBadge estado={g.estado} />}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" />}

        {g && (
          <div className="space-y-6">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Dato k="Cliente" v={g.cliente} />
              <Dato k="Cédula" v={g.cedula_cliente} />
              <Dato k="Teléfono" v={g.telefono_cliente} />
              <Dato k="Dirección" v={g.direccion_cliente} />
              <Dato k="Factura" v={g.numero_factura} />
              <Dato k="Fecha de facturación" v={g.fecha_facturacion} />
              <Dato k="Modelo / código" v={g.modelo_codigo} />
              <Dato k="Tramitado por" v={data.colaborador?.nombre} />
            </div>
            <Dato k="Artículo / desperfecto" v={g.descripcion_articulo} />
            <Dato k="Acción realizada" v={g.accion_realizada} />
            <div className="rounded-md bg-muted/50 p-3 text-xs">
              <strong>Siguiente paso:</strong> {siguientePaso(g.dentro_15_dias, g.no_mal_uso)}
            </div>

            {antig && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="gap-1">
                  <CalendarClock className="h-3 w-3" /> Abierta hace {antig.diasAbierta} días
                </Badge>
                <Badge variant={antig.enAlerta ? "destructive" : "outline"}>
                  {antig.diasSinContacto} días sin contacto
                </Badge>
              </div>
            )}

            <section className="space-y-3">
              <h3 className="font-display font-semibold">Seguimientos ({data.seguimientos.length})</h3>
              {data.seguimientos.map((s: any) => (
                <div key={s.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {s.fecha} · {s.via}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{s.texto}</p>
                </div>
              ))}
              {!soloLectura && (
                <div className="space-y-2 rounded-md border border-dashed border-border p-3">
                  <div className="flex flex-wrap gap-2">
                    <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-44" />
                    <Select value={via} onValueChange={setVia}>
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIAS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea rows={2} placeholder="Detalle del contacto" value={texto} onChange={(e) => setTexto(e.target.value)} />
                  <Button size="sm" disabled={!texto.trim() || nuevoSeg.isPending} onClick={() => nuevoSeg.mutate()}>
                    Agregar seguimiento
                  </Button>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-display font-semibold">
                <ImageIcon className="h-4 w-4" /> Evidencias ({data.evidencias.length})
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data.evidencias.map((e: any) => (
                  <a key={e.id} href={e.url} target="_blank" rel="noreferrer">
                    <img src={e.url} alt="Evidencia del caso" className="h-24 w-full rounded-md object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
              {!soloLectura && (
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={nuevaEv.isPending}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) nuevaEv.mutate(f);
                  }}
                />
              )}
            </section>

            <section className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                disabled={!rtoken?.reporte_token}
                onClick={() =>
                  window.open(
                    `/reporte-garantia/${id}?t=${encodeURIComponent(rtoken!.reporte_token)}`,
                    "_blank",
                  )
                }
              >
                <FileText className="mr-2 h-4 w-4" /> Reporte imprimible
              </Button>
            </section>

            {!soloLectura && g.estado === "proceso" && (
              <section className="space-y-3 rounded-md border border-border p-3">
                <h3 className="font-display font-semibold">Solicitar cierre</h3>
                <Select value={tipoCierre} onValueChange={setTipoCierre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cerrada_cliente_credito">Cerrada — cliente / crédito</SelectItem>
                    <SelectItem value="cerrada_proveedor_cliente">Cerrada — proveedor / cliente</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Número de documento de subsanación (opcional)"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                />
                <Textarea rows={2} placeholder="Nota final" value={notaFinal} onChange={(e) => setNotaFinal(e.target.value)} />
                <Button size="sm" disabled={pedirCierre.isPending} onClick={() => pedirCierre.mutate()}>
                  Enviar a validación
                </Button>
              </section>
            )}

            {g.estado === "revision" && (
              <p className="rounded-md bg-muted/50 p-3 text-sm">
                Este caso está pendiente de validación por un administrador.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Dato({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-sm">{v || "—"}</div>
    </div>
  );
}
