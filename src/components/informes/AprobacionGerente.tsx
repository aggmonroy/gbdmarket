/**
 * Aprobación de la vista de gerencia: mientras no esté aprobada, la gerente
 * no puede consultar el informe del mes en curso.
 */
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aprobarVistaGerente } from "@/lib/informes.functions";
import { MESES_NOMBRE } from "@/lib/informes-shared";

export function AprobacionGerente({
  token,
  periodo,
  visible,
  aprobadoEn,
  estado,
  onCambio,
}: {
  token: string;
  periodo: string;
  visible: boolean;
  aprobadoEn: string | null;
  estado: string;
  onCambio: () => void;
}) {
  const fn = useServerFn(aprobarVistaGerente);
  const [anio, mes] = periodo.split("-");
  const mesNombre = MESES_NOMBRE[Number(mes) - 1] ?? "";

  const mut = useMutation({
    mutationFn: (v: boolean) => fn({ data: { token, periodo, visible: v } }) as any,
    onSuccess: (r: any) => {
      toast.success(r.visible ? "Vista de gerencia aprobada" : "Vista de gerencia retirada");
      onCambio();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar la aprobación"),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" /> Aprobar vista de gerente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          La gerencia solo puede ver el informe del <strong>mes en curso</strong> y únicamente después de que la
          administración lo apruebe. Los históricos, el seguimiento de alertas y la carga de reportes son de uso
          exclusivo de administración.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {mesNombre} {anio}
          </span>
          {visible ? (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado para gerencia
            </Badge>
          ) : (
            <Badge variant="secondary">Pendiente de aprobación</Badge>
          )}
          {estado !== "generado" && <Badge variant="outline">Informe en borrador</Badge>}
        </div>
        {aprobadoEn && visible && (
          <p className="text-xs text-muted-foreground">
            Aprobado el {new Date(aprobadoEn).toLocaleString("es-PA")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => mut.mutate(true)} disabled={mut.isPending || visible}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar vista de gerente
          </Button>
          <Button variant="outline" onClick={() => mut.mutate(false)} disabled={mut.isPending || !visible}>
            Retirar aprobación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
