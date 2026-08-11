/**
 * Llenado manual de las series históricas: ventas de períodos anteriores,
 * clientes nuevos y seguidores de Instagram (con lectura de captura por IA).
 */
import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { guardarSerie, leerInstagram } from "@/lib/informes.functions";
import { aDataUrl } from "@/lib/informes-archivos";
import { MESES_NOMBRE, fmt, mesesDelPeriodoFiscal, type SerieId } from "@/lib/informes-shared";

type SerieFila = { serie: string; periodo: string; datos: Record<string, number | string | null> };

const CAMPOS: Record<SerieId, { id: string; label: string }[]> = {
  ventas_historicas: [
    { id: "contado", label: "Contado (B/.)" },
    { id: "credito", label: "Crédito (B/.)" },
    { id: "total", label: "Total (B/.)" },
  ],
  cobros_historicos: [{ id: "total", label: "Cobros del mes (B/.)" }],
  clientes_nuevos: [{ id: "clientes", label: "Clientes nuevos" }],
  instagram: [
    { id: "linea_blanca", label: "Seguidores Línea Blanca" },
    { id: "bordados", label: "Seguidores Bordados" },
  ],
};

const TITULOS: Record<SerieId, string> = {
  ventas_historicas: "Ventas históricas por mes",
  cobros_historicos: "Cobros históricos por mes",
  clientes_nuevos: "Clientes nuevos por mes",
  instagram: "Seguidores en Instagram",
};

export function SeriesManuales({
  token,
  series,
  inicioFiscal,
  onGuardado,
}: {
  token: string;
  series: SerieFila[];
  inicioFiscal: number;
  onGuardado: () => void;
}) {
  const guardarFn = useServerFn(guardarSerie);
  const leerFn = useServerFn(leerInstagram);
  const igRef = useRef<HTMLInputElement>(null);

  const [serie, setSerie] = useState<SerieId>("ventas_historicas");
  const [anio, setAnio] = useState(String(inicioFiscal + 1));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [valores, setValores] = useState<Record<string, string>>({});

  const periodo = `${anio}-${String(Number(mes)).padStart(2, "0")}`;
  const campos = CAMPOS[serie];

  const historial = useMemo(
    () =>
      series
        .filter((s) => s.serie === serie)
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1))
        .slice(0, 24),
    [series, serie],
  );

  const guardar = useMutation({
    mutationFn: () => {
      const datos: Record<string, number> = {};
      for (const c of campos) {
        const v = Number(String(valores[c.id] ?? "").replace(/,/g, ""));
        if (!Number.isNaN(v) && valores[c.id]) datos[c.id] = v;
      }
      if (serie === "ventas_historicas" && !datos.total)
        datos.total = Math.round(((datos.contado ?? 0) + (datos.credito ?? 0)) * 100) / 100;
      if (!Object.keys(datos).length) throw new Error("Ingresa al menos un valor");
      return guardarFn({ data: { token, serie, periodo, datos } }) as any;
    },
    onSuccess: () => {
      toast.success("Dato histórico guardado");
      setValores({});
      onGuardado();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo guardar"),
  });

  const leerCaptura = useMutation({
    mutationFn: async (file: File) => leerFn({ data: { token, imagen: await aDataUrl(file) } }) as any,
    onSuccess: (r: any) => {
      const cuenta = r?.cuenta === "bordados" ? "bordados" : "linea_blanca";
      setSerie("instagram");
      if (r?.seguidores) setValores((v) => ({ ...v, [cuenta]: String(r.seguidores) }));
      if (/^\d{4}-\d{2}$/.test(String(r?.periodo ?? ""))) {
        const [a, m] = String(r.periodo).split("-");
        setAnio(a!);
        setMes(String(Number(m)));
      }
      toast.success("Captura leída: revisa el valor y guárdalo");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo leer la captura"),
  });

  const anios = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => String(base - 5 + i));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos históricos y manuales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Serie</Label>
            <Select value={serie} onValueChange={(v) => setSerie(v as SerieId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TITULOS) as SerieId[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {TITULOS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mes</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES_NOMBRE.map((n, i) => (
                  <SelectItem key={n} value={String(i + 1)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Año</Label>
            <Select value={anio} onValueChange={setAnio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anios.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {campos.map((c) => (
            <div key={c.id} className="space-y-1.5">
              <Label>{c.label}</Label>
              <Input
                inputMode="decimal"
                value={valores[c.id] ?? ""}
                onChange={(e) => setValores({ ...valores, [c.id]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            {guardar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar {periodo}
          </Button>
          <Button variant="outline" onClick={() => igRef.current?.click()} disabled={leerCaptura.isPending}>
            {leerCaptura.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Leer captura de Instagram
          </Button>
          <input
            ref={igRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) leerCaptura.mutate(f);
            }}
          />
        </div>

        <div className="rounded-md border border-border">
          <div className="border-b border-border px-3 py-2 text-sm font-medium">{TITULOS[serie]} · registrado</div>
          <div className="max-h-64 overflow-auto text-sm">
            {historial.length === 0 && <p className="px-3 py-3 text-muted-foreground">Aún no hay datos de esta serie.</p>}
            {historial.map((h) => (
              <div key={h.periodo} className="flex flex-wrap justify-between gap-2 border-b border-border/60 px-3 py-1.5">
                <span className="font-medium">{h.periodo}</span>
                <span className="text-muted-foreground">
                  {Object.entries(h.datos as Record<string, number>)
                    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${fmt(v)}`)
                    .join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Período fiscal en curso: {mesesDelPeriodoFiscal(inicioFiscal)[0]!.periodo} a{" "}
          {mesesDelPeriodoFiscal(inicioFiscal)[11]!.periodo}. Al generar cada informe, las ventas y cobros del mes se
          registran solos en su serie.
        </p>
      </CardContent>
    </Card>
  );
}
