import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listBitacora, updateBitacora, deleteBitacora, listHistorial } from "@/lib/bitacora.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/bitacora")({
  component: BitacoraPage,
});

const ESTADOS = ["pendiente","cotizado","en_proceso","produccion","listo","entregado","garantia","cancelado"] as const;
const ORIGENES = ["catalogo","financiamiento","garantia","contacto","bordados","whatsapp"] as const;

const ESTADO_LABEL: Record<string,string> = {
  pendiente:"Pendiente", cotizado:"Cotizado", en_proceso:"En proceso",
  produccion:"Producción", listo:"Listo", entregado:"Entregado",
  garantia:"Garantía", cancelado:"Cancelado",
};
const ESTADO_COLOR: Record<string,string> = {
  pendiente:"bg-slate-200 text-slate-800",
  cotizado:"bg-blue-100 text-blue-800",
  en_proceso:"bg-amber-100 text-amber-900",
  produccion:"bg-orange-100 text-orange-900",
  listo:"bg-emerald-100 text-emerald-900",
  entregado:"bg-emerald-600 text-white",
  garantia:"bg-purple-100 text-purple-900",
  cancelado:"bg-rose-100 text-rose-900",
};
const ORIGEN_LABEL: Record<string,string> = {
  catalogo:"Catálogo", financiamiento:"Financiamiento", garantia:"Garantía",
  contacto:"Contacto", bordados:"Bordados", whatsapp:"WhatsApp",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ESTADO_COLOR[estado] ?? "bg-muted"}`}>{ESTADO_LABEL[estado] ?? estado}</span>;
}

function BitacoraPage() {
  const listFn = useServerFn(listBitacora);
  const [origen, setOrigen] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["bitacora", origen, estado, q],
    queryFn: () => listFn({ data: {
      ...(origen !== "all" ? { origen } : {}),
      ...(estado !== "all" ? { estado } : {}),
      ...(q ? { q } : {}),
      limit: 300,
    } as any }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bitácora de interacciones</h1>
        <p className="text-sm text-muted-foreground">Cotizaciones, formularios y clics de WhatsApp desde el sitio público.</p>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs">Buscar</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente, teléfono, producto…" />
          </div>
          <div>
            <Label className="text-xs">Origen</Label>
            <Select value={origen} onValueChange={setOrigen}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ORIGENES.map((o) => <SelectItem key={o} value={o}>{ORIGEN_LABEL[o]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end text-sm text-muted-foreground">{rows.length} registros</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Teléfono</th>
                    <th className="py-2 pr-3">Producto/Servicio</th>
                    <th className="py-2 pr-3">Origen</th>
                    <th className="py-2 pr-3">Entrega</th>
                    <th className="py-2 pr-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r: any) => (
                    <tr key={r.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setSelected(r)}>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3 font-medium">{r.cliente_nombre}</td>
                      <td className="py-2 pr-3 text-xs">{r.cliente_telefono ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs max-w-[240px] truncate">{r.producto_servicio ?? "—"}</td>
                      <td className="py-2 pr-3"><Badge variant="outline">{ORIGEN_LABEL[r.origen] ?? r.origen}</Badge></td>
                      <td className="py-2 pr-3 text-xs">{r.fecha_entrega ?? "—"}</td>
                      <td className="py-2 pr-3"><EstadoBadge estado={r.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && <BitacoraDialog row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export function BitacoraDialog({ row, onClose }: { row: any; onClose: () => void }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateBitacora);
  const deleteFn = useServerFn(deleteBitacora);
  const historialFn = useServerFn(listHistorial);

  const [estado, setEstado] = useState(row.estado);
  const [fecha, setFecha] = useState(row.fecha_entrega ?? "");
  const [obs, setObs] = useState(row.observaciones ?? "");
  const [nota, setNota] = useState("");

  const { data: historial = [] } = useQuery({
    queryKey: ["historial", row.id],
    queryFn: () => historialFn({ data: { id: row.id } }),
  });

  const save = useMutation({
    mutationFn: () => updateFn({ data: {
      id: row.id,
      estado,
      fecha_entrega: fecha || null,
      observaciones: obs || null,
      nota_historial: nota || undefined,
    } as any }),
    onSuccess: () => {
      toast.success("Registro actualizado");
      qc.invalidateQueries({ queryKey: ["bitacora"] });
      qc.invalidateQueries({ queryKey: ["historial", row.id] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al guardar"),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Registro eliminado");
      qc.invalidateQueries({ queryKey: ["bitacora"] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{row.cliente_nombre}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Teléfono:</span> {row.cliente_telefono ?? "—"}</div>
            <div><span className="text-muted-foreground">Correo:</span> {row.cliente_email ?? "—"}</div>
            <div><span className="text-muted-foreground">Origen:</span> {ORIGEN_LABEL[row.origen] ?? row.origen}</div>
            <div><span className="text-muted-foreground">Producto/Servicio:</span> {row.producto_servicio ?? "—"}</div>
            <div><span className="text-muted-foreground">Creado:</span> {new Date(row.created_at).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Consentimiento aceptado:</span> {new Date(row.consent_accepted_at).toLocaleString()}</div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fecha de entrega</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Observaciones</Label>
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
        </div>
        <div>
          <Label className="text-xs">Nota adicional (se guarda en el historial)</Label>
          <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Opcional" />
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <History className="h-3.5 w-3.5" /> Historial de cambios
          </div>
          {historial.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin cambios registrados.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {historial.map((h: any) => (
                <li key={h.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                  {h.estado_anterior && <><EstadoBadge estado={h.estado_anterior} /> <span>→</span></>}
                  <EstadoBadge estado={h.estado_nuevo} />
                  {h.user_email && <span className="text-muted-foreground">· {h.user_email}</span>}
                  {h.nota && <span className="italic">"{h.nota}"</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="destructive" size="sm" onClick={() => { if (confirm("¿Eliminar este registro?")) del.mutate(); }}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar cambios</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
