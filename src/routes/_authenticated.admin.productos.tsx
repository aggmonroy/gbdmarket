import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  listAllProducts,
  upsertProduct,
  deleteProduct,
  bulkImportProducts,
} from "@/lib/products-admin.functions";
import { listAllCategories } from "@/lib/categories-admin.functions";
import { leerFichaProveedor } from "@/lib/ai-product.functions";
import { usePublishFlag } from "@/hooks/use-draft-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export const Route = createFileRoute("/_authenticated/admin/productos")({
  component: ProductsPage,
});

type ProductRow = any;

const empty = {
  name: "",
  brand: "",
  model: "",
  code: "",
  category_id: "",
  description: "",
  features: "",
  price_cash: "",
  price_financed: "",
  disponibilidad: "en_stock",
  images: "",
  datasheet_url: "",
  manual_url: "",
  catalog_url: "",
  is_featured: false,
  is_published: true,
};

function ProductsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllProducts);
  const catsFn = useServerFn(listAllCategories);
  const upsertFn = useServerFn(upsertProduct);
  const deleteFn = useServerFn(deleteProduct);
  const importFn = useServerFn(bulkImportProducts);
  const publish = usePublishFlag();


  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => catsFn(),
  });

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [enlaceIA, setEnlaceIA] = useState("");
  const [leyendo, setLeyendo] = useState(false);
  const leerFichaFn = useServerFn(leerFichaProveedor);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: any) =>
      [p.name, p.brand, p.model, p.code].some((v) => v?.toString().toLowerCase().includes(q)),
    );
  }, [products, search]);

  function openNew() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      brand: p.brand ?? "",
      model: p.model ?? "",
      code: p.code ?? "",
      category_id: p.category_id ?? "",
      description: p.description ?? "",
      features: (p.features ?? []).join("\n"),
      price_cash: String(p.price_cash ?? ""),
      price_financed: p.price_financed != null ? String(p.price_financed) : "",
      disponibilidad: (p.disponibilidad ?? "en_stock") as string,
      images: (p.images ?? []).join("\n"),
      datasheet_url: p.datasheet_url ?? "",
      manual_url: p.manual_url ?? "",
      catalog_url: p.catalog_url ?? "",
      is_featured: !!p.is_featured,
      is_published: !!p.is_published,
    });
    setOpen(true);
  }

  async function leerFicha() {
    const url = enlaceIA.trim();
    if (!url) { toast.error("Pega el enlace del proveedor"); return; }
    setLeyendo(true);
    try {
      const f: any = await leerFichaFn({ data: { url } });
      const cat = categories.find(
        (c: any) => c.name?.toLowerCase() === String(f.categoria ?? "").toLowerCase(),
      );
      setForm((prev: any) => ({
        ...prev,
        name: f.name || prev.name,
        brand: f.brand || prev.brand,
        model: f.model || prev.model,
        code: f.code || prev.code,
        category_id: cat?.id ?? prev.category_id,
        description: f.description || prev.description,
        features: (f.features ?? []).join("\n") || prev.features,
        images: (f.images ?? []).join("\n") || prev.images,
      }));
      toast.success("Ficha generada. Revisa y completa precio y disponibilidad.");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo leer el enlace");
    } finally {
      setLeyendo(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: editingId ?? undefined,
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          model: form.model.trim() || null,
          code: form.code.trim() || null,
          category_id: form.category_id || null,
          description: form.description.trim() || null,
          features: form.features.split("\n").map((s: string) => s.trim()).filter(Boolean),
          price_cash: Number(form.price_cash) || 0,
          price_financed: form.price_financed ? Number(form.price_financed) : null,
          disponibilidad: form.disponibilidad as "en_stock" | "bajo_pedido",
          images: form.images.split("\n").map((s: string) => s.trim()).filter(Boolean),
          datasheet_url: form.datasheet_url.trim() || null,
          manual_url: form.manual_url.trim() || null,
          is_featured: form.is_featured,
          is_published: form.is_published,
          publish,
        },
      });
      toast.success(publish ? (editingId ? "Producto actualizado" : "Producto creado") : "Guardado como borrador");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteFn({ data: { id: confirmDelete.id } });
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  function parseCSV(text: string): any[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const splitLine = (s: string) => {
      const out: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
          if (inQ && s[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
        } else if (ch === "," && !inQ) {
          out.push(cur); cur = "";
        } else cur += ch;
      }
      out.push(cur);
      return out;
    };
    const headers = splitLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((ln) => {
      const cells = splitLine(ln);
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim().replace(/^"|"$/g, ""); });
      return obj;
    });
  }

  async function handleImport() {
    setImporting(true);
    try {
      const rows = parseCSV(csvText);
      if (rows.length === 0) throw new Error("No se detectaron filas. Asegúrate de incluir encabezados.");
      const res = await importFn({ data: { rows } });
      const msg = `${res.created} creados, ${res.updated} actualizados` + (res.errors.length ? `, ${res.errors.length} errores` : "");
      if (res.errors.length) toast.warning(msg); else toast.success(msg);
      setImportOpen(false);
      setCsvText("");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e.message ?? "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en el catálogo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo producto
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, marca, modelo o SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Producto</th>
                  <th className="py-2 pr-3">Marca</th>
                  <th className="py-2 pr-3">Categoría</th>
                  <th className="py-2 pr-3">Precio</th>
                  <th className="py-2 pr-3">Disponibilidad</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Cargando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {products.length === 0 ? "Aún no hay productos. Crea uno o importa un CSV." : "Sin resultados."}
                  </td></tr>
                ) : filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.model ?? p.code ?? ""}</div>
                    </td>
                    <td className="py-2 pr-3">{p.brand ?? "—"}</td>
                    <td className="py-2 pr-3">{p.categories?.name ?? "—"}</td>
                    <td className="py-2 pr-3">${Number(p.price_cash).toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      {p.disponibilidad === "bajo_pedido"
                        ? <Badge variant="outline">Bajo pedido</Badge>
                        : <Badge variant="secondary">En stock</Badge>}
                    </td>
                    <td className="py-2 pr-3 space-x-1">
                      {p.is_published ? <Badge variant="secondary">Publicado</Badge> : <Badge variant="outline">Oculto</Badge>}
                      {p.is_featured && <Badge>Destacado</Badge>}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>

          <div className="rounded-md border border-dashed border-primary/40 bg-primary-soft/30 p-3 space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Lectura con IA desde el enlace del proveedor
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://proveedor.com/producto/..."
                value={enlaceIA}
                onChange={(e) => setEnlaceIA(e.target.value)}
              />
              <Button type="button" variant="secondary" disabled={leyendo} onClick={leerFicha}>
                {leyendo ? "Leyendo…" : "Generar ficha"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La IA completa nombre, marca, modelo, código, categoría, descripción, características e imágenes. El precio y la
              disponibilidad se llenan a mano y todo queda editable.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>SKU / Código</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Precio contado (USD) *</Label>
              <Input type="number" step="0.01" value={form.price_cash} onChange={(e) => setForm({ ...form, price_cash: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Precio financiado (USD)</Label>
              <Input type="number" step="0.01" value={form.price_financed} onChange={(e) => setForm({ ...form, price_financed: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Disponibilidad</Label>
              <Select value={form.disponibilidad} onValueChange={(v) => setForm({ ...form, disponibilidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_stock">Artículo en stock</SelectItem>
                  <SelectItem value="bajo_pedido">Artículo bajo pedido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Características (una por línea)</Label>
              <Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Capacidad 18 pies\nInverter\nNo Frost"} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Imágenes (URLs, una por línea)</Label>
              <Textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ficha técnica (URL)</Label>
              <Input value={form.datasheet_url} onChange={(e) => setForm({ ...form, datasheet_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Manual (URL)</Label>
              <Input value={form.manual_url} onChange={(e) => setForm({ ...form, manual_url: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="pub">Publicado</Label>
              <Switch id="pub" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="feat">Destacado</Label>
              <Switch id="feat" checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar productos desde CSV</DialogTitle>
            <DialogDescription>
              Columnas reconocidas: <code>nombre, marca, modelo, sku, categoria, descripcion, caracteristicas, precio, precio_financiado, stock, imagen, destacado, publicado</code>.
              Las características e imágenes pueden separarse con <code>|</code> o saltos de línea.
              Si el <strong>SKU</strong> ya existe, el producto se actualiza; si no, se crea uno nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input type="file" accept=".csv,text/csv" onChange={handleFile} className="flex-1" />
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const csv = "nombre,marca,modelo,sku,categoria,descripcion,caracteristicas,precio,precio_financiado,stock,imagen,destacado,publicado\nRefrigeradora 18\"\" Inverter,Samsung,RT38,SKU-001,linea-blanca,Refrigeradora No Frost,Inverter|No Frost|18 pies,899.00,999.00,5,https://ejemplo.com/img.jpg,true,true\n";
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "plantilla-productos.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >Descargar plantilla</Button>
            </div>
            <Textarea rows={10} placeholder="O pega el contenido CSV aquí…" value={csvText} onChange={(e) => setCsvText(e.target.value)} className="font-mono text-xs" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
              {importing ? "Importando…" : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción elimina permanentemente <strong>{confirmDelete?.name}</strong> del catálogo.
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
