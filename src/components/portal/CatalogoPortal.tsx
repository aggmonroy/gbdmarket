import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Package, Plus, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { guardarProductoPortal, listCatalogoPortal } from "@/lib/productos-portal.functions";
import { leerFichaProveedorPortal } from "@/lib/ai-product.functions";
import { uploadAssetPortal } from "@/lib/uploads.functions";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

type Form = {
  id?: string;
  name: string;
  brand: string;
  model: string;
  code: string;
  category_id: string;
  description: string;
  features: string;
  price_cash: string;
  price_financed: string;
  disponibilidad: "en_stock" | "bajo_pedido";
  images: string[];
  datasheet_url: string;
  manual_url: string;
  is_published: boolean;
};

const vacio: Form = {
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
  images: [],
  datasheet_url: "",
  manual_url: "",
  is_published: true,
};

/** Catálogo de Línea Blanca y Bordados: los colaboradores pueden crear y editar productos. */
export function CatalogoPortal({ sesion }: { sesion: Sesion }) {
  const soloLectura = sesion.colaborador.rol === "gerente";
  const listFn = useServerFn(listCatalogoPortal);
  const guardarFn = useServerFn(guardarProductoPortal);
  const iaFn = useServerFn(leerFichaProveedorPortal);
  const uploadFn = useServerFn(uploadAssetPortal);

  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [enlace, setEnlace] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["catalogo-portal", q],
    queryFn: () => listFn({ data: { token: sesion.token, q: q || undefined } }) as any,
  });
  const categorias: any[] = data?.categorias ?? [];
  const productos: any[] = data?.productos ?? [];

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const ia = useMutation({
    mutationFn: () => iaFn({ data: { token: sesion.token, url: enlace.trim() } }) as any,
    onSuccess: (ficha: any) => {
      const cat = categorias.find((c) => c.name === ficha.categoria);
      set({
        name: ficha.name || form?.name || "",
        brand: ficha.brand || "",
        model: ficha.model || "",
        code: ficha.code || "",
        description: ficha.description || "",
        features: (ficha.features ?? []).join("\n"),
        images: ficha.images ?? [],
        category_id: cat?.id ?? form?.category_id ?? "",
      });
      toast.success("Ficha generada. Revisa y completa el precio.");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo leer el enlace"),
  });

  const guardar = useMutation({
    mutationFn: () =>
      guardarFn({
        data: {
          token: sesion.token,
          id: form?.id,
          name: form!.name.trim(),
          brand: form!.brand.trim(),
          model: form!.model.trim(),
          code: form!.code.trim(),
          category_id: form!.category_id || "",
          description: form!.description.trim(),
          features: form!.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
          price_cash: Number(form!.price_cash || 0),
          price_financed: form!.price_financed ? Number(form!.price_financed) : null,
          disponibilidad: form!.disponibilidad,
          images: form!.images,
          datasheet_url: form!.datasheet_url.trim(),
          manual_url: form!.manual_url.trim(),
          is_published: form!.is_published,
        },
      }) as any,
    onSuccess: () => {
      toast.success("Producto guardado");
      setForm(null);
      setEnlace("");
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo guardar"),
  });

  async function subir(file: File) {
    setSubiendo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const r: any = await uploadFn({
        data: {
          token: sesion.token,
          bucket: "product-images",
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          base64,
        },
      });
      set({ images: [...(form?.images ?? []), r.url] });
      toast.success("Archivo subido");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  if (form) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {form.id ? "Editar producto" : "Nuevo producto del catálogo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/40 p-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Lectura con IA del enlace del proveedor
            </Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="https://proveedor.com/producto"
              />
              <Button
                type="button"
                onClick={() => ia.mutate()}
                disabled={!enlace.trim() || ia.isPending || soloLectura}
              >
                {ia.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generar ficha
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              El precio y la disponibilidad se llenan a mano. Los demás campos se pueden editar después.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre" value={form.name} onChange={(v) => set({ name: v })} />
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category_id} onValueChange={(v) => set({ category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Campo label="Marca" value={form.brand} onChange={(v) => set({ brand: v })} />
            <Campo label="Modelo" value={form.model} onChange={(v) => set({ model: v })} />
            <Campo label="Código" value={form.code} onChange={(v) => set({ code: v })} />
            <div className="space-y-2">
              <Label>Disponibilidad</Label>
              <Select
                value={form.disponibilidad}
                onValueChange={(v) => set({ disponibilidad: v as Form["disponibilidad"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_stock">Artículo en stock</SelectItem>
                  <SelectItem value="bajo_pedido">Artículo bajo pedido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Campo
              label="Precio de contado (B/.)"
              value={form.price_cash}
              onChange={(v) => set({ price_cash: v })}
              type="number"
            />
            <Campo
              label="Precio financiado (B/.)"
              value={form.price_financed}
              onChange={(v) => set({ price_financed: v })}
              type="number"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Características (una por línea)</Label>
            <Textarea rows={4} value={form.features} onChange={(e) => set({ features: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Imágenes y archivos</Label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((u) => (
                <div key={u} className="relative">
                  <img src={u} alt="" className="h-16 w-16 rounded border object-cover" />
                  <button
                    type="button"
                    onClick={() => set({ images: form.images.filter((x) => x !== u) })}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                {subiendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Subir archivo
              </Button>
              <Input
                placeholder="…o pega un enlace de imagen y presiona Enter"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    e.preventDefault();
                    set({ images: [...form.images, v] });
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void subir(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Ficha técnica (enlace)" value={form.datasheet_url} onChange={(v) => set({ datasheet_url: v })} />
            <Campo label="Manual (enlace)" value={form.manual_url} onChange={(v) => set({ manual_url: v })} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => guardar.mutate()} disabled={!form.name.trim() || guardar.isPending || soloLectura}>
              {guardar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar producto
            </Button>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Catálogo</h2>
          <p className="text-sm text-muted-foreground">
            Línea Blanca y Bordados: {productos.length} productos registrados.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, marca o código"
            className="w-56"
          />
          {!soloLectura && (
            <Button onClick={() => setForm({ ...vacio })}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo producto
            </Button>
          )}
        </div>
      </div>

      {productos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Sin productos.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {productos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="h-14 w-14 rounded border object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded border text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <Badge variant="outline">
                      {p.disponibilidad === "bajo_pedido" ? "Bajo pedido" : "En stock"}
                    </Badge>
                    {!p.is_published && <Badge variant="secondary">Borrador</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[p.brand, p.model, p.code].filter(Boolean).join(" · ") || "—"} · B/.{" "}
                    {Number(p.price_cash ?? 0).toFixed(2)}
                  </p>
                </div>
                {!soloLectura && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setForm({
                        ...vacio,
                        id: p.id,
                        name: p.name ?? "",
                        brand: p.brand ?? "",
                        model: p.model ?? "",
                        code: p.code ?? "",
                        category_id: p.category_id ?? "",
                        price_cash: String(p.price_cash ?? ""),
                        disponibilidad: p.disponibilidad === "bajo_pedido" ? "bajo_pedido" : "en_stock",
                        images: p.images ?? [],
                        is_published: !!p.is_published,
                      })
                    }
                  >
                    Editar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
