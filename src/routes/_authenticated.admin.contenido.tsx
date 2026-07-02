import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listAllBlocks, upsertBlock, deleteBlock } from "@/lib/content-blocks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/_authenticated/admin/contenido")({
  component: ContentPage,
});

const empty = {
  key: "", section: "home", title: "", subtitle: "", body: "",
  image_url: "", cta_label: "", cta_url: "", is_active: true, display_order: 0,
};

function ContentPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllBlocks);
  const upsertFn = useServerFn(upsertBlock);
  const deleteFn = useServerFn(deleteBlock);

  const { data: blocks = [] } = useQuery({ queryKey: ["admin-blocks"], queryFn: () => listFn() });
  const grouped = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const b of blocks) (m[(b as any).section] ??= []).push(b);
    return m;
  }, [blocks]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  function openNew() { setEditingId(null); setForm(empty); setOpen(true); }
  function openEdit(b: any) {
    setEditingId(b.id);
    setForm({
      key: b.key, section: b.section, title: b.title ?? "", subtitle: b.subtitle ?? "",
      body: b.body ?? "", image_url: b.image_url ?? "", cta_label: b.cta_label ?? "",
      cta_url: b.cta_url ?? "", is_active: b.is_active, display_order: b.display_order ?? 0,
    });
    setOpen(true);
  }

  async function save() {
    try {
      await upsertFn({ data: {
        id: editingId ?? undefined,
        key: form.key.trim(),
        section: form.section.trim() || "general",
        title: form.title || null,
        subtitle: form.subtitle || null,
        body: form.body || null,
        image_url: form.image_url || null,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        is_active: !!form.is_active,
        display_order: Number(form.display_order) || 0,
      }});
      toast.success("Guardado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function remove() {
    if (!confirmDelete) return;
    try {
      await deleteFn({ data: { id: confirmDelete.id } });
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirmDelete(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Contenido del sitio</h1>
          <p className="text-sm text-muted-foreground">
            Bloques de textos, banners e imágenes. Se agrupan por sección (ej. <code>home</code>, <code>hero</code>, <code>banners</code>).
          </p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nuevo bloque</Button>
      </div>

      {Object.entries(grouped).map(([section, items]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{section}</CardTitle>
            <CardDescription>{items.length} bloque(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((b: any) => (
                <div key={b.id} className="rounded-lg border p-3 flex gap-3">
                  {b.image_url && <img src={b.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{b.key}</code>
                      {!b.is_active && <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                    {b.title && <div className="mt-1 font-medium truncate">{b.title}</div>}
                    {b.subtitle && <div className="text-xs text-muted-foreground truncate">{b.subtitle}</div>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {blocks.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay bloques. Crea uno con una clave única (ej. <code>hero.title</code>).
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar bloque" : "Nuevo bloque"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Clave *</Label>
                <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="hero.slide1" />
              </div>
              <div className="space-y-1.5">
                <Label>Sección</Label>
                <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="home" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtítulo</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Texto</Label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Texto del botón</Label>
                <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Enlace del botón</Label>
                <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Orden</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.key.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar bloque?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{confirmDelete?.key}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
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
