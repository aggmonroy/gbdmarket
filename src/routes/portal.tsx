import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listColaboradoresLogin, loginConPin } from "@/lib/garantias.functions";
import {
  ESTADOS_PEDIDO,
  ESTADO_PEDIDO_LABEL,
  actualizarPedido,
  agendaDelDia,
  completarTarea,
  listPedidos,
  type EstadoPedido,
} from "@/lib/pedidos.functions";

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
const hoy = () => new Date().toISOString().slice(0, 10);

function Portal() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [vista, setVista] = useState<"menu" | "pedidos" | "calendario">("menu");

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      try {
        setSesion(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem(KEY);
      }
    }
  }, []);

  const guardar = (s: Sesion | null) => {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
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
        {vista === "pedidos" && <Pedidos sesion={sesion} />}
        {vista === "calendario" && <Calendario sesion={sesion} />}
      </div>
    </div>
  );
}

/* ---------------------------------- Ingreso ---------------------------------- */

function Ingreso({ onLogin }: { onLogin: (s: Sesion) => void }) {
  const colaboradoresFn = useServerFn(listColaboradoresLogin);
  const loginFn = useServerFn(loginConPin);
  const { data: colaboradores = [] } = useQuery({ queryKey: ["colab-login"], queryFn: () => colaboradoresFn() });
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");

  const login = useMutation({
    mutationFn: () => loginFn({ data: { colaborador_id: id, pin } }) as any,
    onSuccess: (r: any) => onLogin(r),
    onError: (e: any) => toast.error(e.message ?? "No se pudo ingresar"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <KeyRound className="h-5 w-5 text-primary" /> Acceso de colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona tu nombre e ingresa tu código PIN de 4 dígitos.
          </p>
          <div className="space-y-2">
            <Label>Colaborador</Label>
            <Select value={id} onValueChange={setId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu nombre" />
              </SelectTrigger>
              <SelectContent>
                {(colaboradores as any[]).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">Código PIN</Label>
            <Input
              id="pin"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
            />
          </div>
          <Button className="w-full" disabled={!id || pin.length !== 4 || login.isPending} onClick={() => login.mutate()}>
            {login.isPending ? "Verificando…" : "Ingresar"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            ¿Olvidaste tu PIN? Solicita el cambio desde el{" "}
            <Link to="/modulo-garantias" className="text-primary hover:underline">
              módulo de garantías
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------- Menú ----------------------------------- */

function Menu({ sesion, ir }: { sesion: Sesion; ir: (v: "pedidos" | "calendario") => void }) {
  const rol = sesion.colaborador.rol;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Area
        titulo="Trámite de garantías"
        texto={rol === "gerente" ? "Consulta de casos abiertos y cerrados (solo lectura)." : "Registra casos, seguimientos y solicita cierres."}
        icon={ShieldCheck}
        to="/modulo-garantias"
      />
      <Area
        titulo="Bitácora de pedidos"
        texto="Pre-órdenes de Línea Blanca y Bordados con su estado y seguimiento."
        icon={ClipboardList}
        onClick={() => ir("pedidos")}
      />
      <Area
        titulo="Calendario del día"
        texto="Tareas pendientes de todos los colaboradores y entregas programadas."
        icon={CalendarDays}
        onClick={() => ir("calendario")}
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

/* --------------------------------- Pedidos --------------------------------- */

function Pedidos({ sesion }: { sesion: Sesion }) {
  const soloLectura = sesion.colaborador.rol === "gerente";
  const listFn = useServerFn(listPedidos);
  const updateFn = useServerFn(actualizarPedido);
  const [estado, setEstado] = useState<string>("todos");
  const [q, setQ] = useState("");

  const { data: pedidos = [], refetch } = useQuery({
    queryKey: ["portal-pedidos", estado, q],
    queryFn: () =>
      listFn({
        data: { token: sesion.token, ...(estado !== "todos" ? { estado: estado as EstadoPedido } : {}), q: q || undefined },
      }) as any,
  });

  const guardar = useMutation({
    mutationFn: (v: { id: string; estado?: EstadoPedido; descripcion?: string }) =>
      updateFn({ data: { token: sesion.token, ...v } }) as any,
    onSuccess: () => {
      toast.success("Pedido actualizado");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo actualizar"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" /> Bitácora de pedidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Buscar por número, cliente o producto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS_PEDIDO.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_PEDIDO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!(pedidos as any[]).length && <p className="text-sm text-muted-foreground">No hay pedidos registrados.</p>}

        <div className="space-y-3">
          {(pedidos as any[]).map((p) => (
            <PedidoFila key={p.id} p={p} soloLectura={soloLectura} onGuardar={(v) => guardar.mutate({ id: p.id, ...v })} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PedidoFila({
  p,
  soloLectura,
  onGuardar,
}: {
  p: any;
  soloLectura: boolean;
  onGuardar: (v: { estado?: EstadoPedido; descripcion?: string }) => void;
}) {
  const [descripcion, setDescripcion] = useState(p.descripcion ?? "");
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold">{p.numero_pedido}</div>
          <div className="text-sm">{p.cliente_nombre}</div>
          <div className="text-xs text-muted-foreground">{p.producto_servicio}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ESTADO_PEDIDO_LABEL[p.estado as EstadoPedido] ?? p.estado}</Badge>
          <Button variant="outline" size="sm" asChild>
            <a href={`/pedido/${p.numero_pedido}`} target="_blank" rel="noreferrer">
              <Printer className="mr-1 h-3.5 w-3.5" /> Documento
            </a>
          </Button>
        </div>
      </div>

      {!soloLectura && (
        <div className="flex flex-wrap items-end gap-2">
          <Select value={p.estado} onValueChange={(v) => onGuardar({ estado: v as EstadoPedido })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_PEDIDO.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_PEDIDO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="min-h-[38px] flex-1"
            placeholder="Descripción / nota de seguimiento"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={() => onGuardar({ descripcion })}>
            Guardar nota
          </Button>
        </div>
      )}
      {soloLectura && p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
    </div>
  );
}

/* -------------------------------- Calendario -------------------------------- */

function Calendario({ sesion }: { sesion: Sesion }) {
  const soloLectura = sesion.colaborador.rol === "gerente";
  const agendaFn = useServerFn(agendaDelDia);
  const completarFn = useServerFn(completarTarea);
  const [fecha, setFecha] = useState(hoy());

  const { data, refetch } = useQuery({
    queryKey: ["agenda", fecha],
    queryFn: () => agendaFn({ data: { token: sesion.token, fecha } }) as any,
  });

  const completar = useMutation({
    mutationFn: (id: string) => completarFn({ data: { token: sesion.token, id } }) as any,
    onSuccess: () => {
      toast.success("Tarea completada");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo completar"),
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
                <div className="text-sm font-medium">{t.titulo}</div>
                <div className="text-xs text-muted-foreground">
                  {t.descripcion} · Responsable: {t.responsable}
                  {t.fecha_vencimiento ? ` · Vence: ${t.fecha_vencimiento}` : ""}
                </div>
              </div>
              {!soloLectura && (
                <Button size="sm" variant="outline" onClick={() => completar.mutate(t.id)}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Completar
                </Button>
              )}
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
