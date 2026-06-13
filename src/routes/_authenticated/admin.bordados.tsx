import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { listEmbroideryRequests, updateEmbroideryStatus } from "@/lib/embroidery-admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/bordados")({
  component: EmbroideryPage,
});

const STATUSES = [
  { value: "new", label: "Nueva", className: "bg-warning/15 text-warning border-warning/30" },
  { value: "quoted", label: "Cotizada", className: "bg-primary-soft text-primary border-primary/30" },
  { value: "approved", label: "Aprobada", className: "bg-success/15 text-success border-success/30" },
  { value: "in_progress", label: "En producción", className: "bg-accent/20 text-accent-foreground border-accent/30" },
  { value: "delivered", label: "Entregada", className: "bg-muted text-muted-foreground" },
  { value: "cancelled", label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/30" },
];

function statusInfo(v: string) {
  return STATUSES.find((s) => s.value === v) ?? STATUSES[0];
}

function EmbroideryPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listEmbroideryRequests);
  const updateFn = useServerFn(updateEmbroideryStatus);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-embroidery"],
    queryFn: () => listFn(),
  });
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? rows : rows.filter((r: any) => r.status === filter);

  async function changeStatus(id: string, status: string) {
    try {
      await updateFn({ data: { id, status } });
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["admin-embroidery"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Solicitudes de bordados</h1>
          <p className="text-sm text-muted-foreground">{rows.length} solicitudes recibidas.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Cargando…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Sin solicitudes.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r: any) => {
            const s = statusInfo(r.status);
            return (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{r.name}</h3>
                        <Badge variant="outline" className={s.className}>{s.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString("es-PA")}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Phone className="h-3.5 w-3.5" /> {r.phone}
                        </div>
                        {r.email && (
                          <div className="flex items-center gap-2 text-foreground/80">
                            <Mail className="h-3.5 w-3.5" /> {r.email}
                          </div>
                        )}
                        <div><span className="text-muted-foreground">Servicio:</span> {r.service_type}</div>
                        <div><span className="text-muted-foreground">Cantidad:</span> {r.quantity}</div>
                        {r.colors && <div><span className="text-muted-foreground">Colores:</span> {r.colors}</div>}
                        {r.placement && <div><span className="text-muted-foreground">Ubicación:</span> {r.placement}</div>}
                      </div>
                      {r.notes && (
                        <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">{r.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v)}>
                        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <a
                        href={`https://wa.me/${r.phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-success hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
