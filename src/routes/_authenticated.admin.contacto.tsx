import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSetting, upsertSetting } from "@/lib/site-settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/contacto")({
  component: ContactPage,
});

type Branch = { name: string; phone: string; address: string; maps_url: string };
type Social = { label: string; url: string };
const DEFAULTS = {
  email: "",
  whatsapp_lineablanca: "",
  whatsapp_bordados: "",
  branches: [] as Branch[],
  socials: [] as Social[],
};

function ContactPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSetting);
  const saveFn = useServerFn(upsertSetting);
  const { data, isLoading } = useQuery({
    queryKey: ["setting", "contact"],
    queryFn: () => getFn({ data: { key: "contact" } }),
  });
  const [form, setForm] = useState(DEFAULTS);
  useEffect(() => { if (data) setForm({ ...DEFAULTS, ...(data as any) }); }, [data]);

  async function save() {
    try {
      await saveFn({ data: { key: "contact", value: form } });
      toast.success("Guardado");
      qc.invalidateQueries({ queryKey: ["setting", "contact"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    } catch (e: any) { toast.error(e.message); }
  }

  function updateBranch(i: number, patch: Partial<Branch>) {
    setForm((f) => ({ ...f, branches: f.branches.map((b, idx) => idx === i ? { ...b, ...patch } : b) }));
  }
  function updateSocial(i: number, patch: Partial<Social>) {
    setForm((f) => ({ ...f, socials: f.socials.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Contacto y redes</h1>
        <p className="text-sm text-muted-foreground">Datos que se muestran en el pie del sitio y en formularios.</p>
      </div>

      {isLoading ? <Card><CardContent className="h-40 animate-pulse" /></Card> : <>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5"><Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>WhatsApp Línea Blanca</Label>
              <Input value={form.whatsapp_lineablanca} onChange={(e) => setForm({ ...form, whatsapp_lineablanca: e.target.value })} placeholder="50767841941" /></div>
            <div className="space-y-1.5"><Label>WhatsApp Bordados</Label>
              <Input value={form.whatsapp_bordados} onChange={(e) => setForm({ ...form, whatsapp_bordados: e.target.value })} placeholder="50768298538" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div><CardTitle className="text-base">Sucursales</CardTitle>
              <CardDescription>Nombre, teléfono, dirección y enlace a Google Maps.</CardDescription></div>
            <Button size="sm" variant="outline" onClick={() => setForm({ ...form, branches: [...form.branches, { name: "", phone: "", address: "", maps_url: "" }] })}>
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.branches.length === 0 && <p className="text-sm text-muted-foreground">Sin sucursales.</p>}
            {form.branches.map((b, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="Nombre" value={b.name} onChange={(e) => updateBranch(i, { name: e.target.value })} />
                  <Input placeholder="Teléfono" value={b.phone} onChange={(e) => updateBranch(i, { phone: e.target.value })} />
                </div>
                <Input placeholder="Dirección" value={b.address} onChange={(e) => updateBranch(i, { address: e.target.value })} />
                <Input placeholder="URL Google Maps" value={b.maps_url} onChange={(e) => updateBranch(i, { maps_url: e.target.value })} />
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, branches: form.branches.filter((_, idx) => idx !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div><CardTitle className="text-base">Redes sociales</CardTitle></div>
            <Button size="sm" variant="outline" onClick={() => setForm({ ...form, socials: [...form.socials, { label: "", url: "" }] })}>
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.socials.length === 0 && <p className="text-sm text-muted-foreground">Sin redes.</p>}
            {form.socials.map((s, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto] items-center">
                <Input placeholder="Instagram" value={s.label} onChange={(e) => updateSocial(i, { label: e.target.value })} />
                <Input placeholder="https://..." value={s.url} onChange={(e) => updateSocial(i, { url: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => setForm({ ...form, socials: form.socials.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div><Button onClick={save}>Guardar cambios</Button></div>
      </>}
    </div>
  );
}
