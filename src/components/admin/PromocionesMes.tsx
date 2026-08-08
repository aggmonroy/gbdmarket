import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Check, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { guardarPromocionesMes } from "@/lib/promos-mes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function periodoSiguiente() {
  const d = new Date();
  const m = d.getMonth() + 1;
  const y = m > 11 ? d.getFullYear() + 1 : d.getFullYear();
  const mes = m > 11 ? 0 : m;
  return { periodo: `${y}-${String(mes + 1).padStart(2, "0")}`, etiqueta: `${MESES[mes]} ${y}` };
}

/** Selección mensual de 12 artículos en stock para "Promociones del mes". */
export function PromocionesMes() {
  const qc = useQueryClient();
  const guardar = useServerFn(guardarPromocionesMes);
  const { periodo, etiqueta } = periodoSiguiente();
  const dia = new Date().getDate();
  const enVentana = dia >= 20 && dia <= 30;

  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<string[] | null>(null);

  const { data: productos = [] } = useQuery({
    queryKey: ["promos-mes-productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,brand,images,disponibilidad,categories(slug,name)")
        .eq("is_published", true)
        .eq("disponibilidad", "en_stock")
        .order("name");
      if (error) throw error;
      return (data ?? []).filter((p) => (p as any).categories?.slug !== "bordados");
    },
  });

  const { data: guardadaRow } = useQuery({
    queryKey: ["promos-mes", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promociones_mes")
        .select("product_ids")
        .eq("periodo", periodo)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const elegidos = seleccion ?? (guardadaRow?.product_ids ?? []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      `${p.name} ${p.brand ?? ""} ${(p as any).categories?.name ?? ""}`.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  function toggle(id: string) {
    const actual = [...elegidos];
    const idx = actual.indexOf(id);
    if (idx >= 0) actual.splice(idx, 1);
    else if (actual.length >= 12) {
      toast.error("Ya elegiste 12 artículos. Quita uno para agregar otro.");
      return;
    } else actual.push(id);
    setSeleccion(actual);
  }

  async function save() {
    try {
      await guardar({ data: { periodo, product_ids: elegidos } });
      toast.success(`Promociones de ${etiqueta} guardadas`);
      setSeleccion(null);
      qc.invalidateQueries({ queryKey: ["promos-mes", periodo] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Promociones del mes — {etiqueta}</CardTitle>
            <CardDescription>
              Elige 12 artículos marcados como <strong>en stock</strong> (no se incluyen bordados). La selección
              del mes siguiente se realiza entre el 20 y el 30 de cada mes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={elegidos.length === 12 ? "default" : "secondary"}>{elegidos.length}/12</Badge>
            <Button onClick={save} disabled={elegidos.length === 0}>Guardar selección</Button>
          </div>
        </div>
        {!enVentana && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Fuera del período recomendado (día 20 al 30). Puedes ajustar la selección de todas formas.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Buscar por nombre, marca o categoría…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay artículos en stock que coincidan.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[28rem] overflow-y-auto pr-1">
            {filtrados.map((p) => {
              const activo = elegidos.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${activo ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-4 w-4" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.brand ?? (p as any).categories?.name ?? "—"}
                    </div>
                  </div>
                  {activo && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
