import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listEmbroideryServicesAdmin, upsertEmbroideryService, deleteEmbroideryService } from "@/lib/embroidery-services.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/bordados-servicios")({
  component: Page,
});

type Row = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
};

const empty: Row = { name: "", description: "", image_url: "", display_order: 0, is_active: true };

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listEmbroideryServicesAdmin);
  const upsertFn = useServerFn(upsertEmbroideryService);
  const delFn = useServerFn(deleteEmbroideryService);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["embroidery-services-admin"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Row | null>(null);

  const save = useMutation({
    mutationFn: (r: Row) => upsertFn({ data: r as any }),
    onSuccess: () => {
      toast.success("Servicio guardado");
      qc.invalidateQueries({ queryKey: ["embroidery-services-admin"] });
      qc.invalidateQueries({ queryKey: ["embroidery-services-public"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["embroidery-services-admin"] });
      qc.invalidateQueries({ queryKey: ["embroidery-services-public"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Servicios de Bordados</h1>
          <p className="text-sm text-muted-foreground">Alta, edición, orden y estado de los servicios mostrados en la página pública.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty, display_order: rows.length })}><Plus className="h-4 w-4 mr-1" /> Nuevo servicio</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay servicios. Agrega el primero.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r: any) => (
                <div key={r.id} className={`rounded-xl border border-border overflow-hidden ${r.is_active ? "" : "opacity-60"}`}>
                  <div className="aspect-video bg-muted">
                    {r.image_url ? <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-display font-bold">{r.name}</div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">#{r.display_order}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    <div className="mt-3 flex justify-between items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => { if (confirm(`¿Eliminar "${r.name}"?`)) remove.mutate(r.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <Dialog open onOpenChange={(v) => !v && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Descripción</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Imagen</Label>
                <ImageUploader value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url ?? "" })} bucket="site-assets" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Orden</Label>
                  <Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) || 0 })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <span className="text-sm">{editing.is_active ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={() => save.mutate(editing)} disabled={save.isPending || !editing.name.trim()}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
