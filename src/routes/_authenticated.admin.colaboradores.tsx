import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  desactivarColaborador,
  guardarColaborador,
  listColaboradoresAdmin,
  resolverSolicitudPin,
} from "@/lib/garantias.functions";

export const Route = createFileRoute("/_authenticated/admin/colaboradores")({
  head: () => ({
    meta: [
      { title: "Colaboradores y PIN · Panel GBD" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminColaboradores,
});

const vacio = { nombre: "", cedula: "", rol: "colaborador", activo: true, pin: "" };

function AdminColaboradores() {
  const qc = useQueryClient();
  const listFn = useServerFn(listColaboradoresAdmin);
  const saveFn = useServerFn(guardarColaborador);
  const delFn = useServerFn(desactivarColaborador);
  const pinFn = useServerFn(resolverSolicitudPin);

  const { data } = useQuery({ queryKey: ["colaboradores-admin"], queryFn: () => listFn() as any });
  const [form, setForm] = useState<any>({ ...vacio });

  const refrescar = () => qc.invalidateQueries({ queryKey: ["colaboradores-admin"] });

  const guardar = useMutation({
    mutationFn: () => saveFn({ data: { ...form, pin: form.pin || undefined } }) as any,
    onSuccess: () => {
      toast.success("Colaborador guardado");
      setForm({ ...vacio });
      refrescar();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo guardar"),
  });

  const baja = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }) as any,
    onSuccess: () => {
      toast.success("Colaborador desactivado");
      refrescar();
    },
  });

  const resolver = useMutation({
    mutationFn: (v: { solicitud_id: string; aprobar: boolean }) => pinFn({ data: v }) as any,
    onSuccess: () => {
      toast.success("Solicitud procesada");
      refrescar();
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo procesar"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Colaboradores y PIN</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" /> {form.id ? "Editar colaborador" : "Nuevo colaborador"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Cédula</Label>
            <Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colaborador">Colaborador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gerente">Gerencia (solo lectura)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>PIN (4 dígitos, opcional al editar)</Label>
            <Input
              value={form.pin}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button
              disabled={!form.nombre || guardar.isPending || (!!form.pin && form.pin.length !== 4)}
              onClick={() => guardar.mutate()}
            >
              {guardar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            {form.id && (
              <Button variant="ghost" onClick={() => setForm({ ...vacio })}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(data?.solicitudes ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Solicitudes de PIN pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.solicitudes.map((s: any) => {
              const c = data.colaboradores.find((x: any) => x.id === s.colaborador_id);
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div className="text-sm">
                    <strong>{c?.nombre ?? "Colaborador"}</strong> solicitó un nuevo PIN
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolver.mutate({ solicitud_id: s.id, aprobar: false })}
                    >
                      Rechazar
                    </Button>
                    <Button size="sm" onClick={() => resolver.mutate({ solicitud_id: s.id, aprobar: true })}>
                      Aprobar
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colaboradores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.colaboradores ?? []).map((c: any) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
              <div className="text-sm">
                <div className="font-medium">
                  {c.nombre} <Badge variant="outline">{c.rol}</Badge>{" "}
                  {!c.activo && <Badge variant="secondary">Inactivo</Badge>}
                  {c.pin_bloqueado && <Badge variant="destructive">PIN pendiente</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{c.cedula || "Sin cédula"}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({ id: c.id, nombre: c.nombre, cedula: c.cedula ?? "", rol: c.rol, activo: c.activo, pin: "" })
                  }
                >
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => baja.mutate(c.id)}>
                  Desactivar
                </Button>
              </div>
            </div>
          ))}
          {!(data?.colaboradores ?? []).length && (
            <p className="text-sm text-muted-foreground">Aún no hay colaboradores registrados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
