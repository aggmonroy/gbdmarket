/**
 * Seguimiento de alertas de cuentas con errores de informes anteriores.
 * Cuando una alerta no se corrige en el período siguiente se muestra como
 * "error de arrastre" indicando desde qué mes viene.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, History, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { actualizarAlerta, seguimientoAlertas } from "@/lib/informes.functions";
import { MESES_NOMBRE, bal } from "@/lib/informes-shared";

export function etiquetaPeriodo(periodo: string) {
  const [a, m] = periodo.split("-");
  return `${MESES_NOMBRE[Number(m) - 1] ?? m} ${a}`;
}

type Alerta = {
  id: string;
  periodo: string;
  tipo: string;
  cliente: string | null;
  detalle: string | null;
  monto: number;
  estado: "abierta" | "corregida" | "descartada";
  primer_periodo: string;
  meses_arrastre: number;
  nota: string | null;
};

export function SeguimientoAlertas({ token }: { token: string }) {
  const listar = useServerFn(seguimientoAlertas);
  const actualizar = useServerFn(actualizarAlerta);
  const [filtro, setFiltro] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["informe-alertas"],
    queryFn: () => listar({ data: { token } }) as any,
  });

  const mut = useMutation({
    mutationFn: (p: { id: string; estado: Alerta["estado"]; nota?: string }) =>
      actualizar({ data: { token, ...p } }) as any,
    onSuccess: () => {
      toast.success("Alerta actualizada");
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar la alerta"),
  });

  const alertas: Alerta[] = data?.alertas ?? [];
  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return alertas;
    return alertas.filter((a) =>
      [a.cliente, a.detalle, a.tipo, a.periodo].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [alertas, filtro]);

  const arrastres = alertas.filter((a) => a.estado === "abierta" && a.meses_arrastre > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" /> Seguimiento de alertas de informes anteriores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {arrastres.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> {arrastres.length} error(es) de arrastre sin corregir
              </div>
              <ul className="mt-1 list-disc pl-5 text-xs">
                {arrastres.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    {a.cliente ?? a.tipo} — arrastre desde {etiquetaPeriodo(a.primer_periodo)} (
                    {a.meses_arrastre} mes{a.meses_arrastre === 1 ? "" : "es"} sin corregir)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Input placeholder="Buscar por cliente, tipo o mes…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />

          {isLoading && <p className="text-sm text-muted-foreground">Cargando alertas…</p>}
          {!isLoading && filtradas.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay alertas registradas todavía.</p>
          )}

          <div className="space-y-2">
            {filtradas.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{etiquetaPeriodo(a.periodo)}</Badge>
                  <span className="font-semibold">{a.cliente ?? "—"}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {a.tipo.replace(/_/g, " ")}
                  </Badge>
                  {a.monto ? <span className="tabular-nums text-muted-foreground">{bal(a.monto)}</span> : null}
                  {a.estado === "abierta" && a.meses_arrastre > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
                      Error de arrastre del mes de {etiquetaPeriodo(a.primer_periodo)}
                    </Badge>
                  )}
                  {a.estado === "corregida" && (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Corregida</Badge>
                  )}
                  {a.estado === "descartada" && <Badge variant="secondary">Descartada</Badge>}
                </div>
                {a.detalle && <p className="mt-1 text-xs text-muted-foreground">{a.detalle}</p>}
                {a.nota && <p className="mt-1 text-xs italic text-muted-foreground">Nota: {a.nota}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mut.isPending || a.estado === "corregida"}
                    onClick={() => mut.mutate({ id: a.id, estado: "corregida" })}
                  >
                    {mut.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    Marcar corregida
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={mut.isPending || a.estado === "descartada"}
                    onClick={() => mut.mutate({ id: a.id, estado: "descartada" })}
                  >
                    <XCircle className="mr-1 h-3 w-3" /> Descartar
                  </Button>
                  {a.estado !== "abierta" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={mut.isPending}
                      onClick={() => mut.mutate({ id: a.id, estado: "abierta" })}
                    >
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
