/**
 * Corrección manual de los totales reconocidos por el lector automático o la IA.
 * Cada campo escribe directamente en los datos del informe del período, de modo
 * que el dashboard y la versión imprimible usen el valor corregido.
 */
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, PencilLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarDatos } from "@/lib/informes.functions";
import type { InformeDatos } from "@/lib/informes-shared";

type Campo = { ruta: string[]; etiqueta: string };
type Grupo = { clave: string; titulo: string; campos: Campo[] };

const leer = (obj: any, ruta: string[]) => ruta.reduce((o, k) => (o == null ? undefined : o[k]), obj);

function escribir(obj: any, ruta: string[], valor: number) {
  const copia = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  const [k, ...resto] = ruta;
  if (!k) return copia;
  copia[k] = resto.length ? escribir(copia[k], resto, valor) : valor;
  return copia;
}

/** Grupos de totales editables según los reportes ya cargados. */
function grupos(datos: InformeDatos): Grupo[] {
  const out: Grupo[] = [];
  const d = datos as any;

  if (d.morosidad) {
    const plazosV = Object.keys(d.morosidad.vencida?.plazos ?? {});
    const plazosN = Object.keys(d.morosidad.no_vencida?.plazos ?? {});
    out.push({
      clave: "morosidad",
      titulo: "Morosidad (REPMOROSOS / REPMOROSOS2)",
      campos: [
        { ruta: ["vencida", "total"], etiqueta: "Total morosidad vencida" },
        ...plazosV.map((p) => ({ ruta: ["vencida", "plazos", p], etiqueta: `Vencida · ${p}` })),
        { ruta: ["no_vencida", "total"], etiqueta: "Total morosidad no vencida" },
        { ruta: ["no_vencida", "saldo_actual"], etiqueta: "Saldo actual de cartera" },
        { ruta: ["no_vencida", "cuentas"], etiqueta: "Cuentas por cobrar (cantidad)" },
        ...plazosN.map((p) => ({ ruta: ["no_vencida", "plazos", p], etiqueta: `No vencida · ${p}` })),
      ],
    });
  }

  if (d.repfacmes) {
    out.push({
      clave: "repfacmes",
      titulo: "Ventas y recibos (REPFACMES)",
      campos: [
        { ruta: ["totales", "contado_con"], etiqueta: "Contado con ITBMS" },
        { ruta: ["totales", "credito_con"], etiqueta: "Crédito con ITBMS" },
        { ruta: ["totales", "total_con"], etiqueta: "Ventas totales con ITBMS" },
        { ruta: ["totales", "contado_sin"], etiqueta: "Contado sin ITBMS" },
        { ruta: ["totales", "credito_sin"], etiqueta: "Crédito sin ITBMS" },
        { ruta: ["totales", "total_sin"], etiqueta: "Ventas totales sin ITBMS" },
        { ruta: ["totales", "itbms"], etiqueta: "ITBMS" },
        { ruta: ["abonos_total"], etiqueta: "Total de abonos recibidos" },
      ],
    });
  }

  if (d.repartven) {
    out.push({
      clave: "repartven",
      titulo: "Ventas por producto (REPARTVEN)",
      campos: [
        { ruta: ["total_ventas"], etiqueta: "Total de ventas" },
        { ruta: ["total_ganancia"], etiqueta: "Total de ganancia" },
      ],
    });
  }

  if (d.repvalor2) {
    out.push({
      clave: "repvalor2",
      titulo: "Inventario (REPVALOR2)",
      campos: [
        { ruta: ["total_costo"], etiqueta: "Inventario al costo" },
        { ruta: ["total_venta"], etiqueta: "Inventario a precio de venta" },
      ],
    });
  }

  if (d.repclientes) {
    out.push({
      clave: "repclientes",
      titulo: "Clientes (REPCLIENTES)",
      campos: [
        { ruta: ["total_saldo"], etiqueta: "Saldo total de clientes" },
        { ruta: ["cuentas"], etiqueta: "Cantidad de clientes" },
      ],
    });
  }

  if (d.compras) {
    out.push({
      clave: "compras",
      titulo: "Compras del mes (REPCOMPFCH)",
      campos: [{ ruta: ["total"], etiqueta: "Total de compras" }],
    });
  }

  return out;
}

export function TotalesEditables({
  token,
  periodo,
  datos,
  onGuardado,
}: {
  token: string;
  periodo: string;
  datos: InformeDatos;
  onGuardado: () => void;
}) {
  const lista = grupos(datos);
  if (!lista.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PencilLine className="h-4 w-4 text-primary" /> Totales reconocidos (corrección manual)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Estos son los valores que reconoció el lector automático o la inteligencia artificial. Si alguno no coincide
          con el reporte, corrígelo aquí y guarda: el informe usará el valor corregido.
        </p>
        {lista.map((g) => (
          <GrupoEditable key={g.clave} grupo={g} token={token} periodo={periodo} datos={datos} onGuardado={onGuardado} />
        ))}
      </CardContent>
    </Card>
  );
}

function GrupoEditable({
  grupo,
  token,
  periodo,
  datos,
  onGuardado,
}: {
  grupo: Grupo;
  token: string;
  periodo: string;
  datos: InformeDatos;
  onGuardado: () => void;
}) {
  const guardar = useServerFn(guardarDatos);
  const base = (datos as any)[grupo.clave];
  const valorInicial = () =>
    Object.fromEntries(grupo.campos.map((c) => [c.ruta.join("."), String(leer(base, c.ruta) ?? 0)]));
  const [valores, setValores] = useState<Record<string, string>>(valorInicial);

  useEffect(() => {
    setValores(valorInicial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(base)]);

  const mut = useMutation({
    mutationFn: async () => {
      let siguiente = base;
      for (const c of grupo.campos) {
        const crudo = valores[c.ruta.join(".")] ?? "";
        const n = Number(crudo.replace(/,/g, ""));
        siguiente = escribir(siguiente, c.ruta, Number.isFinite(n) ? n : 0);
      }
      return guardar({ data: { token, periodo, clave: grupo.clave, valor: siguiente } }) as any;
    },
    onSuccess: () => {
      toast.success("Totales actualizados");
      onGuardado();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo guardar"),
  });

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="text-sm font-semibold">{grupo.titulo}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grupo.campos.map((c) => {
          const k = c.ruta.join(".");
          return (
            <div key={k} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{c.etiqueta}</Label>
              <Input
                inputMode="decimal"
                className="tabular-nums"
                value={valores[k] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [k]: e.target.value }))}
              />
            </div>
          );
        })}
      </div>
      <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
        {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar totales
      </Button>
    </div>
  );
}
