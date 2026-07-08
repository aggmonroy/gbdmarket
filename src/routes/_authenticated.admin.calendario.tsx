import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listBitacora } from "@/lib/bitacora.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EstadoBadge, BitacoraDialog } from "./_authenticated.admin.bitacora";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  component: CalendarioPage,
});

const TYPE_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "cotizaciones", label: "Cotizaciones", estados: ["pendiente","cotizado"] },
  { key: "pedidos", label: "Pedidos", estados: ["en_proceso","produccion","listo"] },
  { key: "entregas", label: "Entregas", estados: ["entregado"] },
  { key: "garantias", label: "Garantías", estados: ["garantia"] },
] as const;

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysGrid(anchor: Date) {
  const first = startOfMonth(anchor);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // start on Monday
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const MES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function CalendarioPage() {
  const listFn = useServerFn(listBitacora);
  const [anchor, setAnchor] = useState(new Date());
  const [filter, setFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["calendario"],
    queryFn: () => listFn({ data: { limit: 1000 } as any }),
  });

  const filtered = useMemo(() => {
    const f = TYPE_FILTERS.find((x) => x.key === filter);
    if (!f || filter === "todos") return rows;
    return rows.filter((r: any) => (f as any).estados?.includes(r.estado));
  }, [rows, filter]);

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of filtered) {
      const d = r.fecha_entrega ? new Date(r.fecha_entrega + "T12:00:00") : new Date(r.created_at);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filtered]);

  const days = daysGrid(anchor);
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-muted-foreground">Cotizaciones, pedidos, entregas y garantías por fecha.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-display font-bold min-w-[10rem] text-center">{MES[anchor.getMonth()]} {anchor.getFullYear()}</div>
          <Button variant="outline" size="icon" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAnchor(new Date())}>Hoy</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {DIA.map((d) => <div key={d} className="px-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const events = byDay.get(d.toDateString()) ?? [];
              const isCurrentMonth = d.getMonth() === anchor.getMonth();
              const isToday = isSameDay(d, today);
              return (
                <div key={i}
                  className={`min-h-[100px] rounded-md border p-1.5 ${isCurrentMonth ? "bg-background" : "bg-muted/30"} ${isToday ? "border-primary" : "border-border"}`}>
                  <div className={`text-[10px] font-bold mb-1 ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>{d.getDate()}</div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((e: any) => (
                      <button key={e.id} onClick={() => setSelected(e)}
                        className="w-full text-left text-[10px] rounded px-1.5 py-0.5 bg-primary-soft/70 hover:bg-primary/20 truncate">
                        <span className="font-semibold truncate">{e.cliente_nombre}</span>
                      </button>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{events.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selected && <BitacoraDialog row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
