import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGarantia, getGarantiaReporte } from "@/lib/garantias.functions";
import { ESTADO_LABEL, TEXTO_CONSENTIMIENTO, siguientePaso, type GarantiaEstado } from "@/lib/garantias-shared";

export const Route = createFileRoute("/reporte-garantia/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ t: typeof s.t === "string" ? s.t : undefined }),
  head: () => ({
    meta: [
      { title: "Reporte de garantía · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Reporte imprimible del trámite de garantía." },
    ],
  }),
  component: ReporteGarantia,
});

function ReporteGarantia() {
  const { id } = Route.useParams();
  const { t: rt } = Route.useSearch();
  const getFn = useServerFn(getGarantia);
  const getReporteFn = useServerFn(getGarantiaReporte);
  const [token, setToken] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("gbd_garantias_sesion");
    if (raw) {
      try {
        setToken(JSON.parse(raw).token);
      } catch {
        setToken(null);
      }
    }
    setListo(true);
  }, []);

  // Con enlace firmado (?t=...) el reporte se imprime sin volver a pedir el PIN.
  const { data, error } = useQuery({
    queryKey: ["reporte", id, rt ?? token],
    queryFn: () =>
      (rt
        ? getReporteFn({ data: { garantia_id: id, rt } })
        : getFn({ data: { token: token!, garantia_id: id } })) as any,
    enabled: !!rt || (listo && !!token),
  });

  if (!rt && listo && !token)
    return <p className="p-8 text-center text-sm">Ingresa al módulo de garantías con tu PIN para ver el reporte.</p>;
  if (error) return <p className="p-8 text-center text-sm">{(error as Error).message}</p>;
  if (!data) return <p className="p-8 text-center text-sm">Cargando reporte…</p>;

  const g = data.garantia;

  return (
    <div className="mx-auto max-w-3xl bg-background p-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir o guardar PDF
        </Button>
      </div>

      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold">Reporte de trámite de garantía</h1>
        <p className="text-sm text-muted-foreground">Cooperativa GBD · {ESTADO_LABEL[g.estado as GarantiaEstado]}</p>
        <p className="mt-1 font-mono text-sm font-semibold">{g.numero_garantia}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {SUCURSAL_LABEL[(g.sucursal ?? "las-tablas") as Sucursal]} · WhatsApp de seguimiento:{" "}
          {waVisible(SUCURSAL_WHATSAPP[(g.sucursal ?? "las-tablas") as Sucursal])}
        </p>
      </header>


      <section className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Fila k="Fecha del trámite" v={g.fecha} />
        <Fila k="Cliente" v={g.cliente} />
        <Fila k="Cédula" v={g.cedula_cliente} />
        <Fila k="Teléfono" v={g.telefono_cliente} />
        <Fila k="Dirección" v={g.direccion_cliente} />
        <Fila k="Factura" v={g.numero_factura} />
        <Fila k="Fecha de facturación" v={g.fecha_facturacion} />
        <Fila k="Modelo / código" v={g.modelo_codigo} />
        <Fila k="Tramitado por" v={data.colaborador?.nombre} />
        <Fila k="Fecha de cierre" v={g.fecha_cierre} />
      </section>

      <section className="mt-6 space-y-3 text-sm">
        <Bloque titulo="Artículo y desperfecto" texto={g.descripcion_articulo} />
        <Bloque titulo="Acción realizada" texto={g.accion_realizada} />
        <Bloque titulo="Siguiente paso" texto={siguientePaso(g.dentro_15_dias, g.no_mal_uso)} />
        {data.cierre?.nota_final && <Bloque titulo="Nota final" texto={data.cierre.nota_final} />}
        {data.cierre?.numero_documento_subsanacion && (
          <Bloque titulo="Documento de subsanación" texto={data.cierre.numero_documento_subsanacion} />
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display font-semibold">Seguimientos</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1 pr-2">Fecha</th>
              <th className="py-1 pr-2">Vía</th>
              <th className="py-1">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {data.seguimientos.map((s: any) => (
              <tr key={s.id} className="border-b border-border/60 align-top">
                <td className="py-1 pr-2 whitespace-nowrap">{s.fecha}</td>
                <td className="py-1 pr-2 whitespace-nowrap">{s.via}</td>
                <td className="py-1">{s.texto}</td>
              </tr>
            ))}
            {!data.seguimientos.length && (
              <tr>
                <td colSpan={3} className="py-2 text-muted-foreground">
                  Sin seguimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {data.evidencias.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display font-semibold">Evidencias</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {data.evidencias.map((e: any) => (
              <img key={e.id} src={e.url} alt="Evidencia del trámite de garantía" className="w-full rounded-md border border-border" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-border pt-4 text-sm">
        <p>{TEXTO_CONSENTIMIENTO}</p>
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div className="border-t border-foreground/60 pt-1 text-xs">Firma del cliente</div>
          <div className="border-t border-foreground/60 pt-1 text-xs">Firma del colaborador</div>
        </div>
      </section>
    </div>
  );
}

function Fila({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div>{v || "—"}</div>
    </div>
  );
}

function Bloque({ titulo, texto }: { titulo: string; texto?: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{titulo}</div>
      <p className="whitespace-pre-wrap">{texto || "—"}</p>
    </div>
  );
}
