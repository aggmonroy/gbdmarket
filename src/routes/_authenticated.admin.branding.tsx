import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSetting, upsertSetting } from "@/lib/site-settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

const DEFAULTS = {
  site_name: "Línea Blanca y Bordados GBD",
  site_tagline: "Cooperativa Gladys B. de Ducasa, R.L.",
  logo_url: "",
  favicon_url: "",
  primary_color: "",
  accent_color: "",
};

function BrandingPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSetting);
  const saveFn = useServerFn(upsertSetting);
  const { data, isLoading } = useQuery({
    queryKey: ["setting", "branding"],
    queryFn: () => getFn({ data: { key: "branding" } }),
  });
  const [form, setForm] = useState(DEFAULTS);
  useEffect(() => { if (data) setForm({ ...DEFAULTS, ...(data as any) }); }, [data]);

  async function save() {
    try {
      const publish = typeof window !== "undefined" && window.localStorage.getItem("admin_draft_mode") !== "1"; await saveFn({ data: { key: "branding", value: form, publish } }); qc.invalidateQueries({ queryKey: ["pending-drafts"] });
      toast.success("Guardado. Recarga el sitio para ver los cambios.");
      qc.invalidateQueries({ queryKey: ["setting", "branding"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Marca y colores</h1>
        <p className="text-sm text-muted-foreground">Logo, nombre y paleta institucional.</p>
      </div>
      {isLoading ? <Card><CardContent className="h-40 animate-pulse" /></Card> : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad visual</CardTitle>
            <CardDescription>Los colores se aplican sobre las variables del sitio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre del sitio</Label>
                <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bajada / lema</Label>
                <Input value={form.site_tagline} onChange={(e) => setForm({ ...form, site_tagline: e.target.value })} />
              </div>
            </div>
            <ImageUploader label="Logo institucional" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
            <ImageUploader label="Favicon" value={form.favicon_url} onChange={(url) => setForm({ ...form, favicon_url: url })} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Color primario (HSL)</Label>
                <Input placeholder="215 85% 32%" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
                <p className="text-xs text-muted-foreground">Formato HSL sin coma. Ej: <code>215 85% 32%</code></p>
              </div>
              <div className="space-y-1.5">
                <Label>Color de acento (HSL)</Label>
                <Input placeholder="45 96% 55%" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={save}>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
