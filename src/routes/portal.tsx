import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Calculator,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  LogOut,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginConCedula, solicitarCambioPinPorCedula } from "@/lib/garantias.functions";
import { agendaDelDia } from "@/lib/pedidos.functions";
import { ESTADO_PEDIDO_LABEL, type EstadoPedido } from "@/lib/pedidos-shared";
import { TareasPanel } from "@/components/portal/TareasPanel";
import { SolicitudesActivas } from "@/components/portal/SolicitudesActivas";
import { CasosCerrados } from "@/components/portal/CasosCerrados";
import { CatalogoPortal } from "@/components/portal/CatalogoPortal";
import { SeguimientoDialog } from "@/components/portal/SeguimientoDialog";
import { AsesorPage } from "@/components/calculadora/AsesorPage";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal de colaboradores · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Acceso interno por código PIN para colaboradores de Cooperativa GBD." },
    ],
  }),
  component: Portal,
});

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };
const KEY = "gbd_garantias_sesion";

/** Lee la sesión guardada: localStorage si es un equipo de confianza. */
function leerSesion(): Sesion | null {
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sesion;
  } catch {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    return null;
  }
}
const hoy = () => new Date().toISOString().slice(0, 10);

function Portal() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [vista, setVista] = useState<"menu" | "seguimiento" | "cerrados" | "calendario" | "tareas" | "catalogo" | "calculadora">("menu");

  useEffect(() => {
    setSesion(leerSesion());
  }, []);

  const guardar = (s: Sesion | null, recordar = false) => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (s) (recordar ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s));
    setSesion(s);
    setVista("menu");
  };

  if (!sesion) return <Ingreso onLogin={guardar} />;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Hola, {sesion.colaborador.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              Acceso: <span className="capitalize">{sesion.colaborador.rol}</span>
              {sesion.colaborador.rol === "gerente" && " · solo lectura"}
            </p>
          </div>
          <div className="flex gap-2">
            {vista !== "menu" && (
              <Button variant="outline" onClick={() => setVista("menu")}>
                Volver al menú
              </Button>
            )}
            <Button variant="ghost" onClick={() => guardar(null)}>
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </div>
        </header>

        {vista === "menu" && <Menu sesion={sesion} ir={setVista} />}
        {vista === "seguimiento" && <SolicitudesActivas sesion={sesion} />}
        {vista === "cerrados" && <CasosCerrados sesion={sesion} />}
        {vista === "calendario" && <Calendario sesion={sesion} />}
        {vista === "tareas" && <TareasPanel sesion={sesion} />}
        {vista === "catalogo" && <CatalogoPortal sesion={sesion} />}
        {vista === "calculadora" && <AsesorPage />}
      </div>
    </div>
  );
}

/* ---------------------------------- Ingreso ---------------------------------- */

function Ingreso({ onLogin }: { onLogin: (s: Sesion, recordar: boolean) => void }) {
  const loginFn = useServerFn(loginConCedula);
  const solicitarFn = useServerFn(solicitarCambioPinPorCedula);
  const [cedula, setCedula] = useState("");
  const [pin, setPin] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [modoOlvido, setModoOlvido] = useState(false);

  const login = useMutation({
    mutationFn: () => loginFn({ data: { cedula, pin, recordar } }) as any,
    onSuccess: (r: any) => onLogin(r, recordar),
    onError: (e: any) => toast.error(e.message ?? "No se pudo ingresar"),
  });

  const solicitud = useMutation({
    mutationFn: () => solicitarFn({ data: { cedula, nuevo_pin: pin } }) as any,
    onSuccess: () => {
      toast.success("Solicitud enviada. Un administrador debe aprobarla.");
      setModoOlvido(false);
      setPin("");
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo enviar la solicitud"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <KeyRound className="h-5 w-5 text-primary" />
            {modoOlvido ? "Solicitar nuevo PIN" : "Acceso de colaboradores"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {modoOlvido
              ? "Escribe tu cédula y el nuevo PIN que quieres usar. Un administrador debe aprobar el cambio."
              : "Escribe tu número de cédula y tu código PIN de 4 dígitos."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              autoComplete="username"
              placeholder="Ej. 7-123-4567"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">{modoOlvido ? "Nuevo PIN (4 dígitos)" : "Código PIN"}</Label>
            <Input
              id="pin"
              type="password"
              autoComplete={modoOlvido ? "new-password" : "current-password"}
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </div>
          {!modoOlvido && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              Mantener sesión iniciada en este equipo de confianza
            </label>
          )}
          <Button
            className="w-full"
            disabled={
              cedula.trim().length < 3 || pin.length !== 4 || login.isPending || solicitud.isPending
            }
            onClick={() => (modoOlvido ? solicitud.mutate() : login.mutate())}
          >
            {modoOlvido
              ? solicitud.isPending
                ? "Enviando…"
                : "Enviar solicitud de PIN"
              : login.isPending
                ? "Verificando…"
                : "Ingresar"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline"
            onClick={() => {
              setModoOlvido((v) => !v);
              setPin("");
            }}
          >
            {modoOlvido ? "Volver al ingreso" : "¿Olvidaste tu PIN?"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------- Menú ----------------------------------- */

function Menu({
  sesion,
  ir,
}: {
  sesion: Sesion;
  ir: (v: "seguimiento" | "cerrados" | "calendario" | "tareas" | "catalogo" | "calculadora") => void;
}) {
  const rol = sesion.colaborador.rol;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Area
        titulo="Solicitudes Activas"
        texto="Todo lo pendiente en un solo lugar: pedidos de Línea Blanca, bordados, garantías e interacciones del sitio."
        icon={ListChecks}
        onClick={() => ir("seguimiento")}
      />

      <Area
        titulo="Tareas e incidencias"
        texto={
          rol === "gerente"
            ? "Asigna tareas al personal y consulta la bitácora diaria de tareas e incidencias."
            : "Registra tus tareas del día, incidencias, recordatorios y otros registros con número de orden."
        }
        icon={ListTodo}
        onClick={() => ir("tareas")}
      />
      <Area
        titulo="Trámite de garantías"
        texto={rol === "gerente" ? "Consulta de casos abiertos y cerrados (solo lectura)." : "Registra casos, seguimientos y solicita cierres."}
        icon={ShieldCheck}
        to="/modulo-garantias"
      />
      <Area
        titulo="Bitácora de casos cerrados"
        texto="Casos ya cerrados: consulta por rango de fechas, cliente o número, con detalle imprimible."
        icon={Archive}
        onClick={() => ir("cerrados")}
      />
      <Area
        titulo="Calendario del día"
        texto="Tareas pendientes de todos los colaboradores y entregas programadas."
        icon={CalendarDays}
        onClick={() => ir("calendario")}
      />
      <Area
        titulo="Catálogo de productos"
        texto="Crea y edita productos de Línea Blanca y Bordados, con lectura automática del enlace del proveedor."
        icon={Package}
        onClick={() => ir("catalogo")}
      />
      <Area
        titulo="Calculadora de precios"
        texto="Cotiza Línea Blanca al contado o a crédito, evalúa capacidad de pago y comparte el enlace con el cliente."
        icon={Calculator}
        onClick={() => ir("calculadora")}
      />
      {rol === "admin" && (
        <Area
          titulo="Panel administrativo"
          texto="Contenido del sitio, catálogo, colaboradores y reportes."
          icon={LayoutDashboard}
          to="/admin"
        />
      )}
    </div>
  );
}

function Area({
  titulo,
  texto,
  icon: Icon,
  to,
  onClick,
}: {
  titulo: string;
  texto: string;
  icon: any;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <Card className="h-full transition hover:border-primary hover:shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{texto}</CardContent>
    </Card>
  );
  if (to)
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}


/* -------------------------------- Calendario -------------------------------- */

function Calendario({ sesion }: { sesion: Sesion }) {
  const soloLectura = sesion.colaborador.rol === "gerente";
  const agendaFn = useServerFn(agendaDelDia);
  const [fecha, setFecha] = useState(hoy());

  const { data, refetch } = useQuery({
    queryKey: ["agenda", fecha],
    queryFn: () => agendaFn({ data: { token: sesion.token, fecha } }) as any,
  });

  const tareas = (data?.tareas ?? []) as any[];
  const entregas = (data?.entregas ?? []) as any[];
  const garantias = (data?.garantias ?? []) as any[];

  const dia = useMemo(
    () => new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "long" }),
    [fecha],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Agenda del día
            </span>
            <Input type="date" className="w-44" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm capitalize text-muted-foreground">{dia}</CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tareas pendientes de todo el equipo ({tareas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!tareas.length && <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>}
          {tareas.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">
                  {t.numero_orden ? <span className="font-mono mr-2">{t.numero_orden}</span> : null}
                  {t.titulo}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.descripcion} · Responsable: {t.responsable}
                  {t.fecha_vencimiento ? ` · Vence: ${t.fecha_vencimiento}` : ""}
                </div>
              </div>
              <SeguimientoDialog
                token={sesion.token}
                tareaId={t.id}
                titulo={`${t.numero_orden ?? ""} ${t.titulo}`.trim()}
                soloLectura={soloLectura}
                variant="outline"
                onSaved={() => refetch()}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Entregas programadas ({entregas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!entregas.length && <p className="text-sm text-muted-foreground">Sin entregas para esta fecha.</p>}
          {entregas.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
              <span>
                <span className="font-mono font-semibold">{e.numero_pedido}</span> · {e.cliente_nombre} ·{" "}
                <span className="text-muted-foreground">{e.producto_servicio}</span>
              </span>
              <Badge variant="secondary">{ESTADO_PEDIDO_LABEL[e.estado as EstadoPedido] ?? e.estado}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Garantías abiertas ({garantias.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!garantias.length && <p className="text-sm text-muted-foreground">Sin garantías abiertas.</p>}
          {garantias.map((g) => (
            <div key={g.id} className="rounded-md border border-border p-3 text-sm">
              <span className="font-mono font-semibold">{g.numero_garantia}</span> · {g.cliente} ·{" "}
              <span className="text-muted-foreground">desde {g.fecha}</span>
            </div>
          ))}
          <Button variant="outline" size="sm" asChild>
            <Link to="/modulo-garantias">Abrir módulo de garantías</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
