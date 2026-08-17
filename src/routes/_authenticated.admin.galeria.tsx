import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Images } from "lucide-react";
import { toast } from "sonner";
import { listAllBlocks, upsertBlock, deleteBlock } from "@/lib/content-blocks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "@/components/admin/ImageUploader";

const SECTION = "home.gallery";

export const Route = createFileRoute("/_authenticated/admin/galeria")({
  component: GaleriaPage,
});

type Form = {
  id?: string;
  key: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_url: string;
  is_active: boolean;
  display_order: number;
  duracion_segundos: number;
};

const empty: Form = {
  key: "",
  title: "",
  subtitle: "",
  image_url: "",
  cta_url: "/catalogo",
  is_active: true,
  display_order: 0,
  duracion_segundos: 5,
};

function GaleriaPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllBlocks);
  const upsertFn = useServerFn(upsertBlock);
  const deleteFn = useServerFn(deleteBlock);

  const { data: all = [], isLoading } = useQuery({ queryKey: ["admin-blocks"], queryFn: () => listFn() });

  const items = useMemo(
    () =>
      (all as any[])
        .filter((b) => b.section === SECTION)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [all],
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setForm({
      ...empty,
      key: `home.gallery.${Date.now()}`,
      display_order: items.length,
    });
    setOpen(true);
  }

  function openEdit(b: any) {
    setForm({
      id: b.id,
      key: b.key,
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      image_url: b.image_url ?? "",
      cta_url: b.cta_url ?? "/catalogo",
      is_active: !!b.is_active,
      display_order: b.display_order ?? 0,
      duracion_segundos: b.duracion_segundos ?? 5,
    });
    setOpen(true);
  }

  async function persist(f: Form) {
    await upsertFn({
      data: {
        id: f.id,
        key: f.key,
        section: SECTION,
        title: f.title || null,
        subtitle: f.subtitle || null,
        body: null,
        image_url: f.image_url || null,
        cta_label: null,
        cta_url: f.cta_url || "/catalogo",
        is_active: f.is_active,
        display_order: Number(f.display_order) || 0,
        duracion_segundos: Number(f.duracion_segundos) || 5,
        publish: true,
      },
    });
  }

  async function save() {
    if (!form.image_url) {
      toast.error("Sube una imagen primero");
      return;
    }
    setSaving(true);
    try {
      await persist(form);
      toast.success("Imagen publicada en la galería");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-gallery", SECTION] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    try {
      await persist({
        id: a.id, key: a.key, title: a.title ?? "", subtitle: a.subtitle ?? "",
        image_url: a.image_url ?? "", cta_url: a.cta_url ?? "/catalogo",
        is_active: !!a.is_active, display_order: target, duracion_segundos: a.duracion_segundos ?? 5,
      });
      await persist({
        id: b.id, key: b.key, title: b.title ?? "", subtitle: b.subtitle ?? "",
        image_url: b.image_url ?? "", cta_url: b.cta_url ?? "/catalogo",
        is_active: !!b.is_active, display_order: index, duracion_segundos: b.duracion_segundos ?? 5,
      });
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-gallery", SECTION] });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo reordenar");
    }
  }

  async function toggleActive(b: any, value: boolean) {
    try {
      await persist({
        id: b.id, key: b.key, title: b.title ?? "", subtitle: b.subtitle ?? "",
        image_url: b.image_url ?? "", cta_url: b.cta_url ?? "/catalogo",
        is_active: value, display_order: b.display_order ?? 0, duracion_segundos: b.duracion_segundos ?? 5,
      });
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-gallery", SECTION] });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar");
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    try {
      await deleteFn({ data: { id: confirmDelete.id } });
      toast.success("Imagen eliminada");
      qc.invalidateQueries({ queryKey: ["admin-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-gallery", SECTION] });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Galería del inicio</h1>
          <p className="text-sm text-muted-foreground">
            Tú decides qué imágenes se publican en el banner principal. Se muestran en el orden de esta lista
            y solo las que estén activas. Ya no se cambian automáticamente.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Subir imagen</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Images className="h-4 w-4" /> Imágenes publicadas
          </CardTitle>
          <CardDescription>{items.length} imagen(es) en la galería</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aún no has subido imágenes. Mientras la galería esté vacía, el inicio muestra imágenes de ejemplo.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((b: any, idx: number) => (
                <div key={b.id} className="flex gap-3 rounded-lg border p-3">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title ?? ""} className="h-20 w-28 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="grid h-20 w-28 shrink-0 place-items-center rounded border text-xs text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                      {!b.is_active && <Badge variant="secondary">Oculta</Badge>}
                    </div>
                    <div className="mt-1 truncate font-medium">{b.title || "Sin título"}</div>
                    {b.subtitle && <div className="truncate text-xs text-muted-foreground">{b.subtitle}</div>}
                    <div className="mt-1 truncate text-xs text-muted-foreground">Enlace: {b.cta_url || "/catalogo"}</div>
                    <div className="text-xs text-muted-foreground">Duración: {b.duracion_segundos ?? 5} s</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Switch checked={!!b.is_active} onCheckedChange={(v) => toggleActive(b, v)} />
                      <span className="text-xs text-muted-foreground">Visible en el inicio</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(b)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar imagen" : "Subir imagen a la galería"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              label="Imagen de la galería"
            />
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sala en uso" />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción corta</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Juego de sala y mesa de centro" />
            </div>
            <div className="space-y-1.5">
              <Label>Enlace al hacer clic</Label>
              <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="/catalogo?q=sala" />
            </div>
            <div className="space-y-1.5">
              <Label>Duración en pantalla (segundos)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={form.duracion_segundos}
                onChange={(e) => setForm({ ...form, duracion_segundos: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Tiempo que esta imagen se muestra antes de pasar a la siguiente.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Visible</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.image_url}>
              {saving ? "Guardando…" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta imagen de la galería?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de mostrarse en la página de inicio. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
