import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Package, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { guardarProductoPortal, listCatalogoPortal } from "@/lib/productos-portal.functions";
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
  quote_price_provider: string;
  quote_price_label: string;
  quote_freight: string;
  quote_installation: string;
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
  quote_price_provider: "",
  quote_price_label: "",
  quote_freight: "",
  quote_installation: "",
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
  const uploadFn = useServerFn(uploadAssetPortal);

  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["catalogo-portal", q],
    queryFn: () => listFn({ data: { token: sesion.token, q: q || undefined } }) as any,
  });
  const categorias: any[] = data?.categorias ?? [];
  const productos: any[] = data?.productos ?? [];

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

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
          quote_price_provider: form!.quote_price_provider ? Number(form!.quote_price_provider) : null,
          quote_price_label: form!.quote_price_label ? Number(form!.quote_price_label) : null,
          quote_freight: form!.quote_freight ? Number(form!.quote_freight) : null,
          quote_installation: form!.quote_installation ? Number(form!.quote_installation) : null,
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
            <div className="space-y-2 sm:col-span-2 rounded-md border border-border bg-muted/30 p-3">
              <Label>Precios internos para futuras cotizaciones</Label>
              <div className="grid gap-3 sm:grid-cols-4">
                <Campo label="Proveedor" value={form.quote_price_provider} onChange={(v) => set({ quote_price_provider: v })} type="number" />
                <Campo label="Etiqueta" value={form.quote_price_label} onChange={(v) => set({ quote_price_label: v })} type="number" />
                <Campo label="Flete" value={form.quote_freight} onChange={(v) => set({ quote_freight: v })} type="number" />
                <Campo label="Instalación" value={form.quote_installation} onChange={(v) => set({ quote_installation: v })} type="number" />
              </div>
            </div>
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
                        price_financed: p.price_financed != null ? String(p.price_financed) : "",
                        quote_price_provider: p.quote_price_provider != null ? String(p.quote_price_provider) : "",
                        quote_price_label: p.quote_price_label != null ? String(p.quote_price_label) : "",
                        quote_freight: p.quote_freight != null ? String(p.quote_freight) : "",
                        quote_installation: p.quote_installation != null ? String(p.quote_installation) : "",
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
