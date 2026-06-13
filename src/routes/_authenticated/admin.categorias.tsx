import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listAllCategories,
  upsertCategory,
  deleteCategory,
  listBrands,
} from "@/lib/categories-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: CategoriesPage,
});

const empty = { slug: "", name: "", description: "", icon: "", display_order: 0 };

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function CategoriesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllCategories);
  const upsertFn = useServerFn(upsertCategory);
  const deleteFn = useServerFn(deleteCategory);
  const brandsFn = useServerFn(listBrands);

  const { data: cats = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => listFn() });
  const { data: brands = [] } = useQuery({ queryKey: ["admin-brands"], queryFn: () => brandsFn() });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  function openNew() { setEditingId(null); setForm(empty); setOpen(true); }
  function openEdit(c: any) {
    setEditingId(c.id);
    setForm({
      slug: c.slug, name: c.name,
      description: c.description ?? "", icon: c.icon ?? "",
      display_order: c.display_order ?? 0,
    });
    setOpen(true);
  }

  async function handleSave() {
    try {
      await upsertFn({
        data: {
          id: editingId ?? undefined,
          slug: form.slug || slugify(form.name),
          name: form.name.trim(),
          description: form.description.trim() || null,
          icon: form.icon.trim() || null,
          display_order: Number(form.display_order) || 0,
        },
      });
      toast.success(editingId ? "Categoría actualizada" : "Categoría creada");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteFn({ data: { id: confirmDelete.id } });
      toast.success("Categoría eliminada");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categorías y marcas</h1>
          <p className="text-sm text-muted-foreground">Organiza el catálogo de Línea Blanca.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nueva categoría</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías ({cats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Orden</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Descripción</th>
                  <th className="py-2 pr-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cats.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="py-2 pr-3">{c.display_order}</td>
                    <td className="py-2 pr-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{c.slug}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{c.description ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marcas en uso</CardTitle>
          <CardDescription>Se derivan automáticamente de los productos cargados.</CardDescription>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay marcas. Agrégalas al crear productos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brands.map((b: any) => (
                <Badge key={b.brand} variant="secondary" className="text-sm">
                  {b.brand} · {b.count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => {
                const v = e.target.value;
                setForm({ ...form, name: v, slug: editingId ? form.slug : slugify(v) });
              }} />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Icono (lucide)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="refrigerator" />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Los productos asociados quedarán sin categoría. ¿Continuar con <strong>{confirmDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
