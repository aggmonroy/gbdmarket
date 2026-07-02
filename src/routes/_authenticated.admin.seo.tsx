import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSetting, upsertSetting } from "@/lib/site-settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: SeoPage,
});

const DEFAULTS = {
  meta_title: "",
  meta_description: "",
  og_image_url: "",
  google_analytics_id: "",
  meta_pixel_id: "",
  extra_head_html: "",
};

function SeoPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSetting);
  const saveFn = useServerFn(upsertSetting);
  const { data, isLoading } = useQuery({
    queryKey: ["setting", "seo"],
    queryFn: () => getFn({ data: { key: "seo" } }),
  });
  const [form, setForm] = useState(DEFAULTS);
  useEffect(() => { if (data) setForm({ ...DEFAULTS, ...(data as any) }); }, [data]);

  async function save() {
    try {
      await saveFn({ data: { key: "seo", value: form } });
      toast.success("Guardado");
      qc.invalidateQueries({ queryKey: ["setting", "seo"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">SEO y analítica</h1>
        <p className="text-sm text-muted-foreground">Metadatos, píxeles de seguimiento y scripts adicionales.</p>
      </div>
      {isLoading ? <Card><CardContent className="h-40 animate-pulse" /></Card> : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración general</CardTitle>
            <CardDescription>Se aplica en todo el sitio público.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título por defecto</Label>
              <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción por defecto</Label>
              <Textarea rows={3} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Imagen social (og:image)</Label>
              <Input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Google Analytics 4 (ID)</Label>
                <Input value={form.google_analytics_id} onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })} placeholder="G-XXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Pixel (ID)</Label>
                <Input value={form.meta_pixel_id} onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })} placeholder="1234567890" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>HTML adicional en &lt;head&gt;</Label>
              <Textarea rows={4} value={form.extra_head_html} onChange={(e) => setForm({ ...form, extra_head_html: e.target.value })} placeholder="<!-- scripts extra -->" />
              <p className="text-xs text-muted-foreground">Se inyecta tal cual en el layout raíz. Úsalo con cuidado.</p>
            </div>
            <div className="pt-2"><Button onClick={save}>Guardar cambios</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
