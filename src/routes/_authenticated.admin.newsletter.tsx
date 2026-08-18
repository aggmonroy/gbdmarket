import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  listarNewsletterAdmin,
  guardarNewsletterPost,
  eliminarNewsletterPost,
} from "@/lib/newsletter.functions";
import { GaleriaUploader } from "@/components/admin/GaleriaUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: NewsletterAdmin,
});

const vacio = {
  id: undefined as string | undefined,
  titulo: "",
  resumen: "",
  cuerpo: "",
  tipo: "promocion",
  image_url: "",
  cta_label: "",
  cta_url: "",
  is_published: false,
};

function NewsletterAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listarNewsletterAdmin);
  const saveFn = useServerFn(guardarNewsletterPost);
  const delFn = useServerFn(eliminarNewsletterPost);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: () => listFn(),
  });
  const posts: any[] = data?.posts ?? [];
  const suscriptores: any[] = data?.suscriptores ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(vacio);
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          id: form.id,
          titulo: form.titulo.trim(),
          resumen: form.resumen.trim(),
          cuerpo: form.cuerpo.trim(),
          tipo: form.tipo,
          image_url: form.image_url.trim(),
          cta_label: form.cta_label.trim(),
          cta_url: form.cta_url.trim(),
          is_published: form.is_published,
        },
      });
      toast.success(form.is_published ? "Publicado" : "Guardado como borrador");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
      qc.invalidateQueries({ queryKey: ["newsletter-publicado"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function borrar(id: string) {
    try {
      await delFn({ data: { id } });
      toast.success("Publicación eliminada");
      qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar");
    }
  }

  function exportarCSV() {
    const filas = [
      ["correo", "nombre", "telefono", "intereses", "fecha"],
      ...suscriptores.map((s) => [
        s.email,
        s.nombre ?? "",
        s.telefono ?? "",
        (s.intereses ?? []).join(" | "),
        new Date(s.created_at).toLocaleDateString("es-PA"),
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "suscriptores-newsletter.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Boletín / Newsletter</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} publicaciones · {suscriptores.length} suscriptores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarCSV} disabled={suscriptores.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar suscriptores
          </Button>
          <Button
            onClick={() => {
              setForm(vacio);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva publicación
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay publicaciones. Crea la primera promoción o anuncio.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.titulo} className="h-12 w-16 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{p.resumen ?? ""}</div>
                  </div>
                  <Badge variant={p.tipo === "promocion" ? "default" : "secondary"}>
                    {p.tipo === "promocion" ? "Promoción" : "Anuncio"}
                  </Badge>
                  {p.is_published ? (
                    <Badge variant="secondary">Publicado</Badge>
                  ) : (
                    <Badge variant="outline">Borrador</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setForm({
                        id: p.id,
                        titulo: p.titulo ?? "",
                        resumen: p.resumen ?? "",
                        cuerpo: p.cuerpo ?? "",
                        tipo: p.tipo ?? "anuncio",
                        image_url: p.image_url ?? "",
                        cta_label: p.cta_label ?? "",
                        cta_url: p.cta_url ?? "",
                        is_published: !!p.is_published,
                      }) || setOpen(true)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => borrar(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Mail className="h-4 w-4 text-primary" /> Suscriptores
          </div>
          {suscriptores.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no hay suscriptores.</p>
          ) : (
            <div className="mt-3 max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Intereses</th>
                    <th className="py-2 pr-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suscriptores.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3">{s.email}</td>
                      <td className="py-2 pr-3">{s.nombre ?? "—"}</td>
                      <td className="py-2 pr-3">{(s.intereses ?? []).join(", ") || "—"}</td>
                      <td className="py-2 pr-3">{new Date(s.created_at).toLocaleDateString("es-PA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar publicación" : "Nueva publicación"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promocion">Promoción</SelectItem>
                  <SelectItem value="anuncio">Anuncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="nl-pub">Publicado</Label>
              <Switch
                id="nl-pub"
                checked={form.is_published}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Resumen corto</Label>
              <Textarea
                rows={2}
                maxLength={400}
                value={form.resumen}
                onChange={(e) => setForm({ ...form, resumen: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Contenido</Label>
              <Textarea
                rows={6}
                value={form.cuerpo}
                onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
                placeholder="Detalle de la promoción o anuncio…"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Imagen</Label>
              <GaleriaUploader
                urls={form.image_url ? [form.image_url] : []}
                onChange={(urls: string[]) => setForm({ ...form, image_url: urls[urls.length - 1] ?? "" })}
              />
              <Input
                placeholder="O pegar URL de la imagen"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del botón</Label>
              <Input
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                placeholder="Ver promoción"
              />
            </div>
            <div className="space-y-2">
              <Label>Enlace del botón</Label>
              <Input
                value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={saving || !form.titulo.trim()}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
