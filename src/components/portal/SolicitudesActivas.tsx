import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  HandHelping,
  Inbox,
  PackageCheck,
  PlayCircle,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listColaboradoresLogin } from "@/lib/garantias.functions";
import {
  aceptarTarea,
  actualizarEstadoBordado,
  agregarApoyo,
  asignarTarea,
  cerrarCotizacionInterna,
  finalizarTarea,
  marcarListoEntrega,
  solicitudesActivas,
} from "@/lib/tareas.functions";
import {
  ESTADO_BORDADO_LABEL,
  ESTADOS_BORDADO,
  ESTADO_TAREA_LABEL,
  ESTADOS_TAREA,
  ORIGEN_TAREA_LABEL,
  ORIGENES_TAREA,
  diasEntre,
  normalizarEstado,
  type EstadoBordado,
} from "@/lib/tareas-shared";
import { ReporteRango } from "./ReporteRango";
import { SeguimientoDialog } from "./SeguimientoDialog";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

/** Dashboard clickeable de todo lo pendiente: pedidos, bordados, garantías e interacciones. */
export function SolicitudesActivas({
  sesion,
  onAbrirCotizacion,
}: {
  sesion: Sesion;
  onAbrirCotizacion?: (tareaId: string) => void;
}) {
  const rol = sesion.colaborador.rol;
  const soloLectura = rol === "gerente";
  const listFn = useServerFn(solicitudesActivas);
  const aceptarFn = useServerFn(aceptarTarea);
  const asignarFn = useServerFn(asignarTarea);
  const apoyoFn = useServerFn(agregarApoyo);
  const finalizarFn = useServerFn(finalizarTarea);
  const colabsFn = useServerFn(listColaboradoresLogin);
  const listoFn = useServerFn(marcarListoEntrega);
  const estadoBordadoFn = useServerFn(actualizarEstadoBordado);
  const cerrarCotFn = useServerFn(cerrarCotizacionInterna);

  const [origen, setOrigen] = useState<string>("todos");
  const [estado, setEstado] = useState<string>("todos");
  const [q, setQ] = useState("");

  const { data: colaboradores = [] } = useQuery({ queryKey: ["colab-login"], queryFn: () => colabsFn() });
  const { data, refetch } = useQuery({
    queryKey: ["solicitudes-activas", origen, estado, q],
    queryFn: () =>
      listFn({ data: { token: sesion.token, origen: origen as any, estado: estado as any, q: q || undefined } }) as any,
  });

  const accion = (fn: (v: any) => Promise<any>, mensaje: string) =>
    useMutationLike(fn, mensaje, refetch);

  const aceptar = accion((v) => aceptarFn({ data: { token: sesion.token, ...v } }) as any, "Tarea aceptada");
  const asignar = accion((v) => asignarFn({ data: { token: sesion.token, ...v } }) as any, "Responsable asignado");
  const apoyo = accion((v) => apoyoFn({ data: { token: sesion.token, ...v } }) as any, "Apoyo actualizado");
  const finalizar = accion((v) => finalizarFn({ data: { token: sesion.token, ...v } }) as any, "Finalización registrada");

  const listo = accion((v) => listoFn({ data: { token: sesion.token, ...v } }) as any, "Pedido listo para entrega");
  const estadoBordado = accion(
    (v) => estadoBordadoFn({ data: { token: sesion.token, ...v } }) as any,
    "Estado del pedido actualizado"
  );
  const cerrarCot = accion(
    (v) => cerrarCotFn({ data: { token: sesion.token, ...v } }) as any,
    "Cotización cerrada"
  );

  const items: any[] = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Total pendientes" valor={data?.total ?? 0} activo={origen === "todos"} onClick={() => setOrigen("todos")} />
        {ORIGENES_TAREA.filter((o) => (data?.porOrigen?.[o] ?? 0) > 0 || o === "linea-blanca" || o === "bordados").map((o) => (
          <Kpi
            key={o}
            titulo={ORIGEN_TAREA_LABEL[o]}
            valor={data?.porOrigen?.[o] ?? 0}
            activo={origen === o}
            onClick={() => setOrigen(o)}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5 text-primary" /> Solicitudes Activas
          </CardTitle>
          <ReporteRango sesion={sesion} ambitoInicial="activas" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="Buscar por número, asunto o detalle"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_TAREA.filter((e) => e !== "finalizada").map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_TAREA_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!items.length && <p className="text-sm text-muted-foreground">No tienes solicitudes pendientes. ¡Buen trabajo!</p>}

          <div className="space-y-3">
            {items.map((t) => {
              const est = normalizarEstado(t.estado);
              const esMia = t.asignado_a === sesion.colaborador.id;
              const esApoyo = t.apoyo_a === sesion.colaborador.id;
              const yaFinalicé = esApoyo ? Boolean(t.finalizada_apoyo_en) : Boolean(t.finalizada_responsable_en);
              return (
                <div key={t.id} className="space-y-2 rounded-md border border-border bg-card p-3">
                  {t.origen === "bordados" && t.estado_bordado === "retraso_proveedor" && (
                    <div className="flex items-center gap-3 rounded-xl bg-red-600 p-4 text-white shadow-md">
                      <AlertTriangle className="h-8 w-8 shrink-0" />
                      <div>
                        <div className="font-display text-lg font-bold leading-tight">Retraso por proveedor</div>
                        <p className="text-xs text-white/85">
                          Informa al cliente el nuevo tiempo estimado
                          {t.fecha_vencimiento ? ` · entrega prevista: ${t.fecha_vencimiento}` : ""}.
                        </p>
                      </div>
                    </div>
                  )}
                  {t.origen === "bordados" && t.estado_bordado === "listo_entrega" && (
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-md">
                      <PackageCheck className="h-8 w-8 shrink-0" />
                      <div>
                        <div className="font-display text-lg font-bold leading-tight">Listo para entrega</div>
                        <p className="text-xs text-white/85">Avisa al cliente que puede retirar su pedido.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{ORIGEN_TAREA_LABEL[t.origen as keyof typeof ORIGEN_TAREA_LABEL] ?? "Interno"}</Badge>
                        <Badge variant={est === "pendiente" ? "destructive" : "secondary"}>{ESTADO_TAREA_LABEL[est]}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{t.numero_orden}</span>
                      </div>
                      <div className="mt-1 font-medium">{t.titulo}</div>
                      {t.descripcion && <p className="text-xs text-muted-foreground">{t.descripcion}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Responsable: {t.responsable}
                        {t.apoyo && ` · Apoyo: ${t.apoyo}`} · Abierta hace {diasEntre(t.created_at) ?? 0} día(s)
                      </p>
                    </div>
                    {t.origen === "bordados" && !soloLectura && (
                      <EstadoBordadoControl
                        estadoActual={(t.estado_bordado ?? null) as EstadoBordado | null}
                        fechaEntrega={t.fecha_vencimiento ?? ""}
                        pendiente={estadoBordado.pending}
                        onGuardar={(v) => estadoBordado.run({ id: t.id, ...v })}
                      />
                    )}
                    {t.origen === "cotizacion" && onAbrirCotizacion && (
                      <Button size="sm" onClick={() => onAbrirCotizacion(t.id)}>
                        Abrir calculadora de precios
                      </Button>
                    )}
                    {t.documento_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={t.documento_url} target="_blank" rel="noreferrer">
                          Ver documento
                        </a>
                      </Button>
                    )}
                  </div>

                  {Boolean(t.seguimientos?.length) && (
                    <div className="space-y-1.5 rounded-md border border-border/70 bg-muted/30 p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Seguimientos ({t.seguimientos.length})
                      </p>
                      {t.seguimientos.map((sg: any) => (
                        <div key={sg.id} className="text-xs">
                          <span className="text-muted-foreground">
                            {sg.fecha} · {sg.via === "Otro" && sg.via_detalle ? sg.via_detalle : sg.via} · {sg.autor}:
                          </span>{" "}
                          <span>{sg.texto}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <SeguimientoDialog
                      token={sesion.token}
                      tareaId={t.id}
                      titulo={`${t.numero_orden} · ${t.titulo}`}
                      soloLectura={soloLectura}
                      onSaved={() => refetch()}
                    />
                  </div>

                  {!soloLectura && t.origen === "cotizacion-interna" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => cerrarCot.run({ id: t.id, resultado: "compra" })}
                      >
                        <ThumbsUp className="mr-1.5 h-4 w-4" /> Marcar como compra
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => cerrarCot.run({ id: t.id, resultado: "rechazo" })}>
                        <ThumbsDown className="mr-1.5 h-4 w-4" /> Marcar como rechazo
                      </Button>
                    </div>
                  )}

                  {!soloLectura && (
                    <div className="flex flex-wrap items-center gap-2">
                      {est === "pendiente" && (!t.asignado_a || esMia) && (
                        <Button size="sm" onClick={() => aceptar.run({ id: t.id })}>
                          <UserCheck className="mr-1.5 h-4 w-4" /> Aceptar
                        </Button>
                      )}
                      {rol === "admin" && (
                        <Select value={t.asignado_a ?? ""} onValueChange={(v) => asignar.run({ id: t.id, colaborador_id: v })}>
                          <SelectTrigger className="w-52">
                            <SelectValue placeholder="Asignar responsable" />
                          </SelectTrigger>
                          <SelectContent>
                            {(colaboradores as any[]).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {(esMia || rol === "admin") && est !== "pendiente" && (
                        <Select
                          value={t.apoyo_a ?? "none"}
                          onValueChange={(v) => apoyo.run({ id: t.id, colaborador_id: v === "none" ? null : v })}
                        >
                          <SelectTrigger className="w-52">
                            <SelectValue placeholder="Agregar apoyo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin apoyo</SelectItem>
                            {(colaboradores as any[])
                              .filter((c) => c.id !== t.asignado_a)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  Apoyo: {c.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                      {est === "aceptada" && (esMia || rol === "admin") && (
                        <Button size="sm" variant="secondary" onClick={() => apoyo.run({ id: t.id, colaborador_id: t.apoyo_a ?? null })}>
                          <PlayCircle className="mr-1.5 h-4 w-4" /> Marcar en proceso
                        </Button>
                      )}
                      {(esMia || esApoyo || rol === "admin") && est !== "pendiente" && (
                        <Button size="sm" variant="outline" disabled={yaFinalicé} onClick={() => finalizar.run({ id: t.id })}>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          {yaFinalicé ? "Esperando al otro colaborador" : "Finalizar"}
                        </Button>
                      )}
                      {t.apoyo_a && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <HandHelping className="h-3.5 w-3.5" />
                          {t.finalizada_responsable_en ? "Responsable ✓" : "Responsable pendiente"} ·{" "}
                          {t.finalizada_apoyo_en ? "Apoyo ✓" : "Apoyo pendiente"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ titulo, valor, activo, onClick }: { titulo: string; valor: number; activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition hover:border-primary hover:shadow-soft ${
        activo ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</div>
      <div className="mt-1 font-display text-2xl font-bold">{valor}</div>
    </button>
  );
}

/** Pequeño ayudante para no repetir la configuración de cada mutación. */
function useMutationLike(fn: (v: any) => Promise<any>, mensaje: string, refetch: () => void) {
  const m = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(mensaje);
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo completar la acción"),
  });
  return { run: (v: any) => m.mutate(v), pending: m.isPending };
}
