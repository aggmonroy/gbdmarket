/**
 * Módulo "Informe mensual": carga de reportes, dashboard y versión imprimible.
 * La administración carga y genera; la gerencia consulta e imprime.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileBarChart, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CargaReportes } from "@/components/informes/CargaReportes";
import { DashboardInforme } from "@/components/informes/DashboardInforme";
import { HistorialInformes } from "@/components/informes/HistorialInformes";
import { AprobacionGerente } from "@/components/informes/AprobacionGerente";
import { SeguimientoAlertas, etiquetaPeriodo } from "@/components/informes/SeguimientoAlertas";
import { HistoricosPanel } from "@/components/informes/HistoricosPanel";
import { InformeImprimible } from "@/components/informes/InformeImprimible";
import { SeriesManuales } from "@/components/informes/SeriesManuales";
import { TotalesEditables } from "@/components/informes/TotalesEditables";

import {
  generarExplicaciones,
  generarInforme,
  guardarExplicacion,
  guardarLayout,
  guardarOrden,
  guardarTextos,
  obtenerConsolidado,
  obtenerInforme,
  regenerarGestion,
} from "@/lib/informes.functions";
import { MESES_NOMBRE, bal, infoPeriodo, periodoActual, type InformeMensual } from "@/lib/informes-shared";

type Sesion = { token: string; colaborador: { id: string; nombre: string; rol: string } };

export function InformeMensualPortal({ sesion }: { sesion: Sesion }) {
  const qc = useQueryClient();
  const obtener = useServerFn(obtenerInforme);
  const generar = useServerFn(generarInforme);
  const gestionFn = useServerFn(regenerarGestion);
  const textosFn = useServerFn(guardarTextos);
  const consolidadoFn = useServerFn(obtenerConsolidado);
  const explicacionesFn = useServerFn(generarExplicaciones);
  const explicacionFn = useServerFn(guardarExplicacion);
  const layoutFn = useServerFn(guardarLayout);
  const ordenFn = useServerFn(guardarOrden);

  const inicial = periodoActual();
  const [periodo, setPeriodo] = useState(inicial);
  const [anio, mes] = periodo.split("-");
  const esAdmin = sesion.colaborador.rol === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["informe", periodo],
    queryFn: () => obtener({ data: { token: sesion.token, periodo } }) as any,
  });

  const informe: (InformeMensual & { visible_gerente?: boolean; aprobado_en?: string | null }) | null =
    data?.informe ?? null;
  const bloqueo: "periodo" | "aprobacion" | null = data?.bloqueo ?? null;
  const arrastres = ((data?.alertas ?? []) as any[]).filter((a) => a.estado === "abierta" && a.meses_arrastre > 0);
  const series = data?.series ?? [];
  const { inicioFiscal, mesNombre } = infoPeriodo(periodo);
  const refrescar = () => qc.invalidateQueries({ queryKey: ["informe", periodo] });

  const generarMut = useMutation({
    mutationFn: () => generar({ data: { token: sesion.token, periodo } }) as any,
    onSuccess: () => {
      toast.success("Informe generado");
      refrescar();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo generar el informe"),
  });

  const gestionMut = useMutation({
    mutationFn: () => gestionFn({ data: { token: sesion.token, periodo } }) as any,
    onSuccess: () => {
      toast.success("Gestión operativa actualizada");
      refrescar();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar la gestión"),
  });

  const explicacionesMut = useMutation({
    mutationFn: () => explicacionesFn({ data: { token: sesion.token, periodo } }) as any,
    onSuccess: () => {
      toast.success("Explicaciones generadas con IA");
      refrescar();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudieron generar las explicaciones"),
  });

  const anios = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => String(base - 3 + i));
  }, []);

  const [tipo, setTipo] = useState<"trimestral" | "anual">("trimestral");
  const [trimestre, setTrimestre] = useState("1");
  const consolidado = useMutation<any>({
    mutationFn: () =>
      consolidadoFn({
        data: { token: sesion.token, inicioFiscal, tipo, trimestre: Number(trimestre) },
      }) as any,
    onError: (e: any) => toast.error(e?.message ?? "No se pudo consolidar"),
  });

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileBarChart className="h-5 w-5 text-primary" /> Informe mensual de la mueblería
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Mes del informe</Label>
            <Select value={String(Number(mes))} onValueChange={(v) => setPeriodo(`${anio}-${v.padStart(2, "0")}`)}>
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
            <Select value={anio} onValueChange={(v) => setPeriodo(`${v}-${mes}`)}>
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
          {esAdmin && (
            <Button onClick={() => generarMut.mutate()} disabled={generarMut.isPending}>
              {generarMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generar informe
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando informe…</p>}

      {!isLoading && !informe && bloqueo === "periodo" && (
        <p className="text-sm text-muted-foreground">
          La gerencia solo puede consultar el informe del mes en curso.
        </p>
      )}

      {!isLoading && !informe && bloqueo === "aprobacion" && (
        <p className="text-sm text-muted-foreground">
          El informe de {mesNombre} {anio} todavía no ha sido aprobado por la administración para la vista de gerencia.
        </p>
      )}

      {!isLoading && !informe && !bloqueo && (
        <p className="text-sm text-muted-foreground">
          Todavía no hay informe de {mesNombre} {anio}. La administración debe cargar los reportes y generarlo.
        </p>
      )}

      {esAdmin && arrastres.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm print:hidden">
          <div className="font-semibold text-destructive">
            {arrastres.length} alerta(s) de cuentas con errores sin corregir
          </div>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {arrastres.slice(0, 6).map((a: any) => (
              <li key={a.id}>
                {a.cliente ?? a.tipo}: error de arrastre del mes de {etiquetaPeriodo(a.primer_periodo)} (
                {a.meses_arrastre} mes{a.meses_arrastre === 1 ? "" : "es"} sin corregir)
              </li>
            ))}
          </ul>
        </div>
      )}

      {informe && (
        <Tabs defaultValue={esAdmin ? "carga" : "dashboard"}>
          <TabsList className="print:hidden">
            {esAdmin && <TabsTrigger value="carga">Carga de datos</TabsTrigger>}
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            {esAdmin && <TabsTrigger value="textos">Textos y gestión</TabsTrigger>}
            <TabsTrigger value="imprimir">Versión imprimible</TabsTrigger>
            <TabsTrigger value="consolidado">Trimestral / anual</TabsTrigger>
            {esAdmin && <TabsTrigger value="alertas">Seguimiento de alertas</TabsTrigger>}
            {esAdmin && <TabsTrigger value="historicos">Históricos</TabsTrigger>}
            {esAdmin && <TabsTrigger value="gerente">Aprobar vista de gerente</TabsTrigger>}
            {esAdmin && <TabsTrigger value="historico">Histórico</TabsTrigger>}
          </TabsList>

          {esAdmin && (
            <TabsContent value="alertas" className="pt-4">
              <SeguimientoAlertas token={sesion.token} />
            </TabsContent>
          )}

          {esAdmin && (
            <TabsContent value="historicos" className="pt-4">
              <HistoricosPanel token={sesion.token} />
            </TabsContent>
          )}

          {esAdmin && (
            <TabsContent value="gerente" className="pt-4">
              <AprobacionGerente
                token={sesion.token}
                periodo={periodo}
                visible={Boolean(informe.visible_gerente)}
                aprobadoEn={informe.aprobado_en ?? null}
                estado={informe.estado}
                onCambio={refrescar}
              />
            </TabsContent>
          )}

          {esAdmin && (
            <TabsContent value="historico" className="pt-4">
              <HistorialInformes
                token={sesion.token}
                onCambio={() => {
                  qc.invalidateQueries({ queryKey: ["informe"] });
                }}
                onVerPeriodo={setPeriodo}
              />
            </TabsContent>
          )}


          {esAdmin && (
            <TabsContent value="carga" className="space-y-4 pt-4">
              <CargaReportes
                token={sesion.token}
                periodo={periodo}
                datos={informe.datos ?? {}}
                archivos={data?.archivos ?? []}
                onCargado={refrescar}
              />
              <TotalesEditables
                token={sesion.token}
                periodo={periodo}
                datos={informe.datos ?? {}}
                onGuardado={refrescar}
              />
              <SeriesManuales
                token={sesion.token}
                series={series}
                inicioFiscal={inicioFiscal}
                onGuardado={refrescar}
              />
            </TabsContent>
          )}


          <TabsContent value="dashboard" className="space-y-3 pt-4">
            {esAdmin && (
              <Card className="print:hidden">
                <CardContent className="flex flex-wrap items-center gap-3 pt-6">
                  <Button onClick={() => explicacionesMut.mutate()} disabled={explicacionesMut.isPending}>
                    {explicacionesMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Explicar tablas con IA
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Cada tarjeta tiene su explicación editable y controles de ancho y alto. Al aprobar el dashboard,
                    todo pasa a la versión imprimible y a la vista de gerencia.
                  </p>
                </CardContent>
              </Card>
            )}
            <DashboardInforme
              informe={informe}
              series={series}
              edicion={
                esAdmin
                  ? {
                      explicacion: (seccion, texto) =>
                        explicacionFn({ data: { token: sesion.token, periodo, seccion, texto } })
                          .then(refrescar)
                          .catch((e: any) => toast.error(e?.message ?? "No se pudo guardar la explicación")),
                      tamano: (seccion, ancho, escala) =>
                        layoutFn({ data: { token: sesion.token, periodo, seccion, ancho, escala } })
                          .then(refrescar)
                          .catch((e: any) => toast.error(e?.message ?? "No se pudo guardar el tamaño")),
                      orden: (zona, orden) =>
                        ordenFn({ data: { token: sesion.token, periodo, zona, orden } })
                          .then(refrescar)
                          .catch((e: any) => toast.error(e?.message ?? "No se pudo guardar el orden")),
                    }
                  : undefined
              }
            />
          </TabsContent>

          {esAdmin && (
            <TabsContent value="textos" className="pt-4">
              <EditorTextos
                informe={informe}
                onGuardar={(payload) =>
                  textosFn({ data: { token: sesion.token, periodo, ...payload } })
                    .then(() => {
                      toast.success("Textos guardados");
                      refrescar();
                    })
                    .catch((e: any) => toast.error(e?.message ?? "No se pudo guardar"))
                }
                onRegenerar={() => gestionMut.mutate()}
                regenerando={gestionMut.isPending}
              />
            </TabsContent>
          )}

          <TabsContent value="imprimir" className="pt-4">
            {informe.visible_gerente ? (
              <InformeImprimible informe={informe} series={series} />
            ) : (
              <p className="text-sm text-muted-foreground">
                El informe aún no está aprobado. Revisa el dashboard y aprueba la vista de gerente para habilitar la
                impresión y la consulta de la gerencia.
              </p>
            )}
          </TabsContent>


          <TabsContent value="consolidado" className="space-y-3 pt-4">
            <Card>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual del período fiscal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trimestre</Label>
                  <Select value={trimestre} onValueChange={setTrimestre} disabled={tipo === "anual"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}º trimestre
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => consolidado.mutate()} disabled={consolidado.isPending}>
                  {consolidado.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Consolidar
                </Button>
              </CardContent>
            </Card>

            {consolidado.data && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base uppercase">
                    Consolidado {consolidado.data.tipo} · período {consolidado.data.periodoFiscal}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Kpi label="Ventas totales" valor={bal(consolidado.data.totales.total)} />
                    <Kpi label="Contado" valor={bal(consolidado.data.totales.contado)} />
                    <Kpi label="Crédito" valor={bal(consolidado.data.totales.credito)} />
                    <Kpi label="Abonos" valor={bal(consolidado.data.totales.abonos)} />
                    <Kpi label="Compras" valor={bal(consolidado.data.totales.compras)} />
                    <Kpi label="Morosidad al cierre" valor={bal(consolidado.data.totales.morosidad_ultimo)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/60">
                          {["Mes", "Contado", "Crédito", "Total", "Abonos"].map((h) => (
                            <th key={h} className="border border-border px-2 py-1 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {consolidado.data.meses.map((m: any) => (
                          <tr key={m.periodo}>
                            <td className="border border-border px-2 py-1">{m.periodo}</td>
                            <td className="border border-border px-2 py-1 text-right">{bal(m.contado)}</td>
                            <td className="border border-border px-2 py-1 text-right">{bal(m.credito)}</td>
                            <td className="border border-border px-2 py-1 text-right">{bal(m.total)}</td>
                            <td className="border border-border px-2 py-1 text-right">{bal(m.abonos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(consolidado.data.lineas as Record<string, number>).map(([k, v]) => (
                      <span key={k} className="text-xs text-muted-foreground">
                        <strong className="text-foreground">{k}:</strong> {bal(v)}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="font-display font-bold tabular-nums">{valor}</div>
    </div>
  );
}

function EditorTextos({
  informe,
  onGuardar,
  onRegenerar,
  regenerando,
}: {
  informe: InformeMensual;
  onGuardar: (p: { narrativa?: Record<string, string>; gestion?: InformeMensual["gestion"] }) => void;
  onRegenerar: () => void;
  regenerando: boolean;
}) {
  const [narrativa, setNarrativa] = useState<Record<string, string>>(informe.narrativa ?? {});
  const [gestion, setGestion] = useState(
    informe.gestion ?? { general: "", colaboradores: [] as InformeMensual["gestion"]["colaboradores"] },
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Textos del informe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["ventas", "recuperacion", "lineas", "compras", "alertas"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="capitalize">{k}</Label>
              <Textarea
                rows={4}
                value={narrativa[k] ?? ""}
                onChange={(e) => setNarrativa({ ...narrativa, [k]: e.target.value })}
              />
            </div>
          ))}
          <Button onClick={() => onGuardar({ narrativa })}>Guardar textos</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
            Gestión operativa por colaborador
            <Button variant="outline" size="sm" onClick={onRegenerar} disabled={regenerando}>
              {regenerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerar con las acciones del portal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Introducción</Label>
            <Textarea rows={3} value={gestion.general} onChange={(e) => setGestion({ ...gestion, general: e.target.value })} />
          </div>
          {gestion.colaboradores.map((c, i) => (
            <div key={c.nombre} className="space-y-1.5 rounded-md border border-border p-3">
              <div className="text-sm font-semibold">{c.nombre}</div>
              <Label className="text-xs text-muted-foreground">Redacción automática</Label>
              <Textarea
                rows={4}
                value={c.texto_ia}
                onChange={(e) => {
                  const arr = [...gestion.colaboradores];
                  arr[i] = { ...c, texto_ia: e.target.value };
                  setGestion({ ...gestion, colaboradores: arr });
                }}
              />
              <Label className="text-xs text-muted-foreground">Aspectos agregados manualmente</Label>
              <Textarea
                rows={3}
                value={c.texto_manual}
                onChange={(e) => {
                  const arr = [...gestion.colaboradores];
                  arr[i] = { ...c, texto_manual: e.target.value };
                  setGestion({ ...gestion, colaboradores: arr });
                }}
              />
            </div>
          ))}
          <Button onClick={() => onGuardar({ gestion })}>Guardar gestión operativa</Button>
        </CardContent>
      </Card>
    </div>
  );
}
