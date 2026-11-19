import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, ClipboardList, FileText, Loader2, Printer, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  abrirDocumento,
  listarRegistro,
  listarSolicitudesDocumentos,
  resolverSolicitudDocumento,
  solicitarAccionDocumento,
} from "@/lib/formatos-registro.functions";
import {
  ACCION_DOCUMENTO_LABEL,
  ESTADO_DOCUMENTO_LABEL,
  hoyPanama as hoyISO,
  puedeResolverDocumentos,
  puedeSolicitarAnulacion,
  veTodoElRegistro,
  type AccionDocumento,
  type EstadoDocumento,
} from "@/lib/formatos-registro";
import { fechaCorta } from "@/lib/formatos";
import type { Apertura } from "./registro-ctx";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

type DocFila = {
  id: string;
  numero: string;
  formato: string;
  titulo: string;
  fecha: string;
  estado: EstadoDocumento;
  impresiones: number;
  created_at: string;
  motivo_resolucion: string | null;
  emitido_por_nombre: string;
  resuelto_por_nombre: string | null;
  solicitud: { accion: AccionDocumento } | null;
};
type SolicitudFila = {
  id: string;
  documento_id: string;
  accion: AccionDocumento;
  motivo: string;
  solicitado_por_nombre: string;
  documento: (DocFila & { emitido_por_nombre: string }) | null;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PA", { hour: "numeric", minute: "2-digit", timeZone: "America/Panama" });

const varianteEstado = (e: EstadoDocumento) => (e === "vigente" ? "secondary" : "destructive") as "secondary" | "destructive";

/** Registro diario de documentos emitidos: consultar, reimprimir y anular. */
export function RegistroPanel({
  sesion,
  onVolver,
  onAbrir,
}: {
  sesion: Sesion;
  onVolver: () => void;
  onAbrir: (formato: string, apertura: Apertura) => void;
}) {
  const rol = sesion.colaborador.rol;
  const esAdmin = puedeResolverDocumentos(rol);
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [q, setQ] = useState("");
  const [eliminados, setEliminados] = useState(false);
  const [accion, setAccion] = useState<{ id: string; numero: string; accion: AccionDocumento } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [resolver, setResolver] = useState<{ id: string; numero: string; aprobar: boolean } | null>(null);
  const [nota, setNota] = useState("");
  const [abriendo, setAbriendo] = useState<string | null>(null);

  const qc = useQueryClient();
  const listFn = useServerFn(listarRegistro);
  const solsFn = useServerFn(listarSolicitudesDocumentos);
  const abrirFn = useServerFn(abrirDocumento);
  const accionFn = useServerFn(solicitarAccionDocumento);
  const resolverFn = useServerFn(resolverSolicitudDocumento);

  const lista = useQuery({
    queryKey: ["registro-documentos", desde, hasta, q, eliminados],
    queryFn: () =>
      listFn({ data: { token: sesion.token, desde, hasta: hasta < desde ? desde : hasta, q: q || undefined, incluirEliminados: eliminados } }),
  });
  const solicitudes = useQuery({
    queryKey: ["registro-documentos-solicitudes"],
    queryFn: () => solsFn({ data: { token: sesion.token } }),
    enabled: esAdmin,
  });
  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["registro-documentos"] });
    void qc.invalidateQueries({ queryKey: ["registro-documentos-solicitudes"] });
    void qc.invalidateQueries({ queryKey: ["solicitudes-activas"] });
  };

  const enviarAccion = useMutation({
    mutationFn: () => accionFn({ data: { token: sesion.token, id: accion!.id, accion: accion!.accion, motivo } }),
    onSuccess: (r) => {
      toast.success(
        r.aplicado
          ? `${ACCION_DOCUMENTO_LABEL[accion!.accion]} aplicada a ${accion!.numero}`
          : "Solicitud enviada. El administrador la revisará en sus tareas pendientes.",
      );
      setAccion(null);
      setMotivo("");
      refrescar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enviarResolucion = useMutation({
    mutationFn: () =>
      resolverFn({ data: { token: sesion.token, solicitud_id: resolver!.id, aprobar: resolver!.aprobar, nota } }),
    onSuccess: () => {
      toast.success(resolver!.aprobar ? "Solicitud aprobada" : "Solicitud rechazada");
      setResolver(null);
      setNota("");
      refrescar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function abrir(id: string) {
    setAbriendo(id);
    try {
      const d = await abrirFn({ data: { token: sesion.token, id } });
      onAbrir(d.formato, { id: d.id, numero: d.numero, estado: d.estado, clave: d.clave, datos: d.datos });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir el documento");
    } finally {
      setAbriendo(null);
    }
  }

  const docs = (lista.data ?? []) as DocFila[];
  const dias = Array.from(new Set(docs.map((d) => d.fecha)));
  const pendientes = (solicitudes.data ?? []) as SolicitudFila[];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onVolver}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a formatos
      </Button>
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ClipboardList className="h-5 w-5 text-primary" /> Registro diario de documentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Cada formato impreso o descargado queda guardado aquí con su número para consultarlo o reimprimirlo.
          {veTodoElRegistro(rol) ? " Ves los documentos de todos los colaboradores." : " Ves los documentos que tú emitiste."}
          {esAdmin
            ? " Como administrador puedes anular o eliminar y aprobar lo que piden los demás."
            : " Para anular o eliminar uno, envía la solicitud y el administrador la aprueba."}
        </p>
      </div>

      {esAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Solicitudes por aprobar ({pendientes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {solicitudes.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!solicitudes.isLoading && !pendientes.length && (
              <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
            )}
            {pendientes.map((s) => (
              <div key={s.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3">
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive">{ACCION_DOCUMENTO_LABEL[s.accion as AccionDocumento]}</Badge>
                    <span className="font-mono text-xs">{s.documento?.numero}</span>
                  </div>
                  <div className="mt-1 font-medium">{s.documento?.titulo ?? "Documento"}</div>
                  <p className="text-xs text-muted-foreground">
                    Pedido por {s.solicitado_por_nombre} · emitido por {s.documento?.emitido_por_nombre ?? "—"} el{" "}
                    {s.documento ? fechaCorta(s.documento.fecha) : "—"}
                  </p>
                  <p className="text-xs">Motivo: {s.motivo}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.documento && (
                    <Button variant="outline" size="sm" disabled={abriendo === s.documento_id} onClick={() => abrir(s.documento_id)}>
                      <FileText className="mr-1 h-4 w-4" /> Revisar
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setResolver({ id: s.id, numero: s.documento?.numero ?? "", aprobar: true })}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setResolver({ id: s.id, numero: s.documento?.numero ?? "", aprobar: false })}>
                    <XCircle className="mr-1 h-4 w-4" /> Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <Label className="space-y-1 text-xs">
              <span>Desde</span>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value || hoyISO())} />
            </Label>
            <Label className="space-y-1 text-xs">
              <span>Hasta</span>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value || hoyISO())} />
            </Label>
            <Label className="min-w-48 flex-1 space-y-1 text-xs">
              <span>Buscar</span>
              <Input placeholder="Número o nombre del formato" value={q} onChange={(e) => setQ(e.target.value)} />
            </Label>
            {esAdmin && (
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={eliminados} onChange={(e) => setEliminados(e.target.checked)} />
                Mostrar eliminados
              </label>
            )}
          </div>

          {lista.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {lista.error && <p className="text-sm text-destructive">{(lista.error as Error).message}</p>}
          {!lista.isLoading && !docs.length && (
            <p className="text-sm text-muted-foreground">No hay documentos emitidos en estas fechas.</p>
          )}

          {dias.map((dia) => (
            <section key={dia} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{fechaCorta(dia)}</h3>
              {docs
                .filter((d) => d.fecha === dia)
                .map((d) => (
                  <div key={d.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-card p-3">
                    <div className="min-w-0 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{d.numero}</span>
                        <Badge variant={varianteEstado(d.estado as EstadoDocumento)}>
                          {ESTADO_DOCUMENTO_LABEL[d.estado as EstadoDocumento]}
                        </Badge>
                        {d.solicitud && (
                          <Badge variant="outline">
                            {ACCION_DOCUMENTO_LABEL[d.solicitud.accion as AccionDocumento]} solicitada
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 font-medium">{d.titulo}</div>
                      <p className="text-xs text-muted-foreground">
                        {hora(d.created_at)} · {d.emitido_por_nombre} · impreso {d.impresiones} {d.impresiones === 1 ? "vez" : "veces"}
                      </p>
                      {d.estado !== "vigente" && d.motivo_resolucion && (
                        <p className="text-xs text-destructive">
                          Motivo: {d.motivo_resolucion}
                          {d.resuelto_por_nombre ? ` · ${d.resuelto_por_nombre}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" disabled={abriendo === d.id} onClick={() => abrir(d.id)}>
                        {abriendo === d.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Printer className="mr-1 h-4 w-4" />}
                        Abrir / reimprimir
                      </Button>
                      {(esAdmin || puedeSolicitarAnulacion(rol)) && !d.solicitud && d.estado !== "eliminado" && (
                        <>
                          {d.estado === "vigente" && (
                            <Button variant="outline" size="sm" onClick={() => setAccion({ id: d.id, numero: d.numero, accion: "anular" })}>
                              <Ban className="mr-1 h-4 w-4" /> {esAdmin ? "Anular" : "Solicitar anulación"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setAccion({ id: d.id, numero: d.numero, accion: "eliminar" })}>
                            <Trash2 className="mr-1 h-4 w-4" /> {esAdmin ? "Eliminar" : "Solicitar eliminación"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </section>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!accion} onOpenChange={(o) => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accion && (esAdmin ? ACCION_DOCUMENTO_LABEL[accion.accion] : `Solicitar ${accion.accion === "anular" ? "anulación" : "eliminación"}`)}{" "}
              de {accion?.numero}
            </DialogTitle>
            <DialogDescription>
              {esAdmin
                ? accion?.accion === "anular"
                  ? "El documento queda marcado como ANULADO y ya no se puede volver a emitir."
                  : "El documento deja de aparecer en el registro (queda guardado para el administrador)."
                : "El administrador recibirá la solicitud como tarea pendiente y deberá aprobarla."}
            </DialogDescription>
          </DialogHeader>
          <Label className="space-y-1 text-sm">
            <span>Motivo</span>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Ej. error en el monto del Yappy" />
          </Label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccion(null)}>
              Cancelar
            </Button>
            <Button disabled={motivo.trim().length < 3 || enviarAccion.isPending} onClick={() => enviarAccion.mutate()}>
              {enviarAccion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {esAdmin ? "Confirmar" : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolver} onOpenChange={(o) => !o && setResolver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolver?.aprobar ? "Aprobar" : "Rechazar"} solicitud de {resolver?.numero}
            </DialogTitle>
            <DialogDescription>La tarea pendiente se cerrará con tu decisión.</DialogDescription>
          </DialogHeader>
          <Label className="space-y-1 text-sm">
            <span>Nota (opcional)</span>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} />
          </Label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolver(null)}>
              Cancelar
            </Button>
            <Button
              variant={resolver?.aprobar ? "default" : "destructive"}
              disabled={enviarResolucion.isPending}
              onClick={() => enviarResolucion.mutate()}
            >
              {enviarResolucion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resolver?.aprobar ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
