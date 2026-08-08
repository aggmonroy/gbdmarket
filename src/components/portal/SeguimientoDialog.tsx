import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listSeguimientosTarea, registrarSeguimientoTarea } from "@/lib/tareas.functions";
import { VIAS_SEGUIMIENTO, type ViaSeguimiento } from "@/lib/tareas-shared";

const hoy = () => new Date().toISOString().slice(0, 10);

/**
 * Registro de una acción de seguimiento sobre cualquier solicitud activa
 * (Línea Blanca, bordados, garantías o registros internos).
 */
export function SeguimientoDialog({
  token,
  tareaId,
  titulo,
  soloLectura = false,
  label = "Seguimiento",
  variant = "secondary",
  onSaved,
}: {
  token: string;
  tareaId: string;
  titulo?: string;
  soloLectura?: boolean;
  label?: string;
  variant?: "default" | "secondary" | "outline";
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState(hoy());
  const [via, setVia] = useState<ViaSeguimiento>("Personalmente");
  const [viaDetalle, setViaDetalle] = useState("");
  const [texto, setTexto] = useState("");

  const registrarFn = useServerFn(registrarSeguimientoTarea);
  const listFn = useServerFn(listSeguimientosTarea);

  const { data: historial = [], refetch } = useQuery({
    queryKey: ["tarea-seguimientos", tareaId, open],
    queryFn: () => listFn({ data: { token, id: tareaId } }) as any,
    enabled: open,
  });

  const guardar = useMutation({
    mutationFn: () =>
      registrarFn({
        data: { token, id: tareaId, fecha, via, via_detalle: viaDetalle || undefined, texto },
      }) as any,
    onSuccess: () => {
      toast.success("Seguimiento registrado");
      setTexto("");
      setViaDetalle("");
      refetch();
      onSaved?.();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo registrar el seguimiento"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant}>
          <MessageSquarePlus className="mr-1.5 h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar seguimiento</DialogTitle>
          <DialogDescription>{titulo ?? "Indica cómo contactaste al cliente y qué acción realizaste."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`fecha-${tareaId}`}>Fecha</Label>
              <Input id={`fecha-${tareaId}`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vía de contacto</Label>
              <Select value={via} onValueChange={(v) => setVia(v as ViaSeguimiento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIAS_SEGUIMIENTO.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {via === "Otro" && (
            <div className="space-y-1.5">
              <Label htmlFor={`detalle-${tareaId}`}>¿Cuál otra vía?</Label>
              <Input
                id={`detalle-${tareaId}`}
                placeholder="Escribe la vía utilizada"
                maxLength={120}
                value={viaDetalle}
                onChange={(e) => setViaDetalle(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`texto-${tareaId}`}>Acción realizada</Label>
            <Textarea
              id={`texto-${tareaId}`}
              className="min-h-24"
              placeholder="Describe la gestión, acuerdos o próximos pasos"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          {!soloLectura && (
            <Button
              className="w-full"
              disabled={!texto.trim() || (via === "Otro" && !viaDetalle.trim()) || guardar.isPending}
              onClick={() => guardar.mutate()}
            >
              {guardar.isPending ? "Guardando…" : "Guardar seguimiento"}
            </Button>
          )}

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Historial</p>
            {!(historial as any[]).length && <p className="text-sm text-muted-foreground">Aún no hay seguimientos.</p>}
            {(historial as any[]).map((s) => (
              <div key={s.id} className="rounded-md border border-border p-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  {s.fecha} · {s.via === "Otro" && s.via_detalle ? s.via_detalle : s.via} · {s.autor}
                </div>
                <div>{s.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
