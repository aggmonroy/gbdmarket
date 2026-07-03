import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listAllPromotions, upsertPromotion, deletePromotion } from "@/lib/promotions.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/_authenticated/admin/promociones")({
  component: PromosPage,
});

const empty = {
  title: "", description: "", discount_pct: 0,
  starts_at: "", ends_at: "", product_ids: [] as string[],
  image_url: "", is_active: true,
};

function toLocal(dt?: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function PromosPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllPromotions);
  const saveFn = useServerFn(upsertPromotion);
  const delFn = useServerFn(deletePromotion);
  const { data: rows = [] } = useQuery({ queryKey: ["admin-promotions"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [confirmDel, setConfirmDel] = useState<any>(null);

  function openNew() { setEditingId(null); setForm(empty); setOpen(true); }
  function openEdit(p: any) {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description ?? "", discount_pct: Number(p.discount_pct) || 0,
      starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at),
      product_ids: p.product_ids ?? [], image_url: p.image_url ?? "", is_active: !!p.is_active,
    });
    setOpen(true);
  }
  async function save() {
    try {
      const publish = typeof window !== "undefined" && window.localStorage.getItem("admin_draft_mode") !== "1";
      await saveFn({ data: {
        id: editingId ?? undefined,
        title: form.title.trim(),
        description: form.description || null,
        discount_pct: Number(form.discount_pct) || 0,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        product_ids: form.product_ids,
        image_url: form.image_url || null,
        is_active: !!form.is_active,
        publish,
      }});
      toast.success(publish ? "Guardado" : "Guardado como borrador");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      qc.invalidateQueries({ queryKey: ["pending-drafts"] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function remove() {
    if (!confirmDel) return;
    try {
      await delFn({ data: { id: confirmDel.id } });
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirmDel(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-sm text-muted-foreground">Descuentos y campañas con vigencia opcional.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nueva promoción</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} promoción(es)</CardTitle>
          <CardDescription>Marcar como inactiva para ocultar del sitio.</CardDescription></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay promociones.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((p: any) => (
                <div key={p.id} className="rounded-lg border p-3 flex gap-3">
                  {p.image_url && <img src={p.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{p.title}</div>
                      <Badge variant="secondary">-{p.discount_pct}%</Badge>
                      {!p.is_active && <Badge variant="outline">Inactiva</Badge>}
                    </div>
                    {p.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</div>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDel(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar promoción" : "Nueva promoción"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5"><Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Descripción</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Descuento (%)</Label>
                <Input type="number" min={0} max={100} value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: e.target.value })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Activa</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Inicio</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Fin</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
            <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.title.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{confirmDel?.title}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
