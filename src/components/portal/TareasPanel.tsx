import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ListTodo, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listColaboradoresLogin } from "@/lib/garantias.functions";
import { cerrarTarea, crearTarea, listTareas, reabrirTarea } from "@/lib/tareas.functions";
import {
  ESTADO_TAREA_LABEL,
  ESTADOS_TAREA,
  TIPO_TAREA_LABEL,
  TIPOS_TAREA,
  type TipoTarea,
} from "@/lib/tareas-shared";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };
const hoy = () => new Date().toISOString().slice(0, 10);

export function TareasPanel({ sesion }: { sesion: Sesion }) {
  const rol = sesion.colaborador.rol;
  const esGerente = rol === "gerente";
  const puedeAsignar = rol === "admin" || rol === "gerente";

  const listFn = useServerFn(listTareas);
  const crearFn = useServerFn(crearTarea);
  const cerrarFn = useServerFn(cerrarTarea);
  const reabrirFn = useServerFn(reabrirTarea);
  const colabsFn = useServerFn(listColaboradoresLogin);

  const [tipo, setTipo] = useState<string>("todos");
  const [estado, setEstado] = useState<string>("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");

  const { data: colaboradores = [] } = useQuery({ queryKey: ["colab-login"], queryFn: () => colabsFn() });
  const { data: tareas = [], refetch } = useQuery({
    queryKey: ["tareas", tipo, estado, desde, hasta, q],
    queryFn: () =>
      listFn({ data: { token: sesion.token, tipo: tipo as any, estado: estado as any, desde, hasta, q: q || undefined } }) as any,
  });

  const cerrar = useMutation({
    mutationFn: (id: string) => cerrarFn({ data: { token: sesion.token, id } }) as any,
    onSuccess: () => {
      toast.success("Registro marcado como culminado");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo actualizar"),
  });

  const reabrir = useMutation({
    mutationFn: (id: string) => reabrirFn({ data: { token: sesion.token, id } }) as any,
    onSuccess: () => {
      toast.success("Registro reabierto");
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo reabrir"),
  });

  /* ------------------------------ Alta de registros ------------------------------ */
  const tiposPermitidos: TipoTarea[] = esGerente ? ["tarea", "recordatorio"] : [...TIPOS_TAREA];
  const [nuevo, setNuevo] = useState<{
    tipo: TipoTarea;
    titulo: string;
    descripcion: string;
    asignado_a: string;
    fecha: string;
    fecha_vencimiento: string;
  }>({ tipo: esGerente ? "tarea" : "diaria", titulo: "", descripcion: "", asignado_a: "", fecha: hoy(), fecha_vencimiento: "" });

  const crear = useMutation({
    mutationFn: () =>
      crearFn({
        data: {
          token: sesion.token,
          tipo: nuevo.tipo,
          titulo: nuevo.titulo,
          descripcion: nuevo.descripcion,
          asignado_a: nuevo.asignado_a || undefined,
          fecha: nuevo.fecha,
          fecha_vencimiento: nuevo.fecha_vencimiento || undefined,
        },
      }) as any,
    onSuccess: (r: any) => {
      toast.success(`Registro creado · ${r?.numero_orden ?? ""}`);
      setNuevo((n) => ({ ...n, titulo: "", descripcion: "", fecha_vencimiento: "" }));
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo crear el registro"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            {esGerente ? "Asignar tarea al personal" : "Nuevo registro del día"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Tipo de registro</Label>
            <Select value={nuevo.tipo} onValueChange={(v) => setNuevo({ ...nuevo, tipo: v as TipoTarea })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposPermitidos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_TAREA_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Responsable</Label>
            <Select value={nuevo.asignado_a || sesion.colaborador.id} onValueChange={(v) => setNuevo({ ...nuevo, asignado_a: v })}>
              <SelectTrigger disabled={!puedeAsignar}>
                <SelectValue placeholder="Yo" />
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

          <div className="space-y-1 sm:col-span-2">
            <Label>Título</Label>
            <Input
              value={nuevo.titulo}
              onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
              placeholder={nuevo.tipo === "incidencia" ? "Situación fuera del marco regular de trabajo" : "Descripción breve"}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label>Detalle</Label>
            <Textarea
              value={nuevo.descripcion}
              onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
              placeholder="Explica qué se hizo o qué ocurrió, para poder detectar áreas de mejora."
            />
          </div>

          <div className="space-y-1">
            <Label>Fecha del registro</Label>
            <Input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} />
          </div>

          <div className="space-y-1">
            <Label>Vence (opcional)</Label>
            <Input
              type="date"
              value={nuevo.fecha_vencimiento}
              onChange={(e) => setNuevo({ ...nuevo, fecha_vencimiento: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <Button disabled={nuevo.titulo.trim().length < 3 || crear.isPending} onClick={() => crear.mutate()}>
              {crear.isPending ? "Guardando…" : "Guardar registro"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="h-5 w-5 text-primary" /> Bitácora de tareas, incidencias y recordatorios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Toda naturaleza</SelectItem>
                {TIPOS_TAREA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_TAREA_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_TAREA.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_TAREA_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
            <Input placeholder="Buscar por número o texto" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {!(tareas as any[]).length && <p className="text-sm text-muted-foreground">No hay registros con estos filtros.</p>}

          <div className="space-y-3">
            {(tareas as any[]).map((t) => (
              <div key={t.id} className="rounded-md border border-border bg-card p-3 space-y-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={t.tipo === "incidencia" ? "destructive" : "default"}>
                        {TIPO_TAREA_LABEL[t.tipo as TipoTarea] ?? t.tipo}
                      </Badge>
                      <span className="font-mono text-sm font-semibold">{t.numero_orden ?? "—"}</span>
                      <Badge variant="secondary">{ESTADO_TAREA_LABEL[t.estado as "pendiente"] ?? t.estado}</Badge>
                    </div>
                    <div className="text-sm font-medium">{t.titulo}</div>
                    {t.descripcion && <div className="text-xs text-muted-foreground">{t.descripcion}</div>}
                    <div className="text-xs text-muted-foreground">
                      {t.fecha} · Responsable: {t.responsable} · Registró: {t.autor}
                      {t.fecha_vencimiento ? ` · Vence: ${t.fecha_vencimiento}` : ""}
                      {t.cerrada_por ? ` · Culminó: ${t.cerrada_por}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {t.estado === "pendiente" ? (
                      <Button size="sm" variant="outline" onClick={() => cerrar.mutate(t.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Culminada
                      </Button>
                    ) : (
                      !esGerente && (
                        <Button size="sm" variant="ghost" onClick={() => reabrir.mutate(t.id)}>
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reabrir
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
