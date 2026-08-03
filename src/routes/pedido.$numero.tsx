import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Printer, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPedido, ESTADO_PEDIDO_LABEL, type EstadoPedido } from "@/lib/pedidos.functions";
import { buildWaUrl, type WaChannel } from "@/lib/whatsapp";

export const Route = createFileRoute("/pedido/$numero")({
  head: () => ({
    meta: [
      { title: "Pre-orden de pedido · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Documento imprimible de la pre-orden de pedido de Cooperativa GBD." },
    ],
  }),
  component: PedidoDoc,
});

type Item = { descripcion: string; cantidad: number; detalle?: string };

function PedidoDoc() {
  const { numero } = Route.useParams();
  const getFn = useServerFn(getPedido);
  const { data, error } = useQuery({
    queryKey: ["pedido", numero],
    queryFn: () => getFn({ data: { numero } }) as any,
  });

  if (error) return <p className="p-8 text-center text-sm">{(error as Error).message}</p>;
  if (!data) return <p className="p-8 text-center text-sm">Cargando pedido…</p>;

  const items: Item[] = Array.isArray(data.meta?.items) ? data.meta.items : [];
  const canal: WaChannel = data.meta?.canal === "bordados" ? "bordados" : "linea-blanca";
  const fecha = new Date(data.created_at).toLocaleString("es-PA");

  const texto = [
    `*Pre-orden ${data.numero_pedido}* — Cooperativa GBD`,
    `Fecha: ${fecha}`,
    `Cliente: ${data.cliente_nombre}`,
    data.cliente_telefono ? `Teléfono: ${data.cliente_telefono}` : "",
    data.cliente_email ? `Correo: ${data.cliente_email}` : "",
    data.categoria ? `Categoría: ${data.categoria}` : "",
    "",
    "*Detalle del pedido:*",
    ...(items.length
      ? items.map((i) => `• ${i.cantidad} x ${i.descripcion}${i.detalle ? ` (${i.detalle})` : ""}`)
      : [`• ${data.producto_servicio ?? "—"}`]),
    data.observaciones ? `\nObservaciones: ${data.observaciones}` : "",
    `\nEstado actual: ${ESTADO_PEDIDO_LABEL[data.estado as EstadoPedido] ?? data.estado}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-3xl bg-background p-6 sm:p-8 print:p-0">
      <div className="mb-6 flex flex-wrap justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir o guardar PDF
        </Button>
        <Button
          className="bg-whatsapp text-whatsapp-foreground hover:opacity-90"
          onClick={() => window.open(buildWaUrl(canal, texto), "_blank")}
        >
          <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
        </Button>
      </div>

      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold">Pre-orden de pedido</h1>
        <p className="text-sm text-muted-foreground">
          Cooperativa Gladys B. de Ducasa, R.L. · {ESTADO_PEDIDO_LABEL[data.estado as EstadoPedido] ?? data.estado}
        </p>
        <p className="mt-1 font-mono text-lg font-semibold">{data.numero_pedido}</p>
        <p className="text-xs text-muted-foreground">Emitida el {fecha}</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Fila k="Cliente" v={data.cliente_nombre} />
        <Fila k="Teléfono" v={data.cliente_telefono} />
        <Fila k="Correo" v={data.cliente_email} />
        <Fila k="Categoría" v={data.categoria} />
        <Fila k="Origen" v={data.origen} />
        <Fila k="Fecha de entrega" v={data.fecha_entrega} />
      </section>

      <section className="mt-6">
        <h2 className="font-display font-semibold">Detalle</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-16 py-1 pr-2">Cant.</th>
              <th className="py-1 pr-2">Producto o servicio</th>
              <th className="py-1">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {(items.length ? items : [{ cantidad: 1, descripcion: data.producto_servicio ?? "—" }]).map(
              (i: Item, idx: number) => (
                <tr key={idx} className="border-b border-border/60 align-top">
                  <td className="py-1 pr-2">{i.cantidad}</td>
                  <td className="py-1 pr-2">{i.descripcion}</td>
                  <td className="py-1 text-muted-foreground">{i.detalle || "—"}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      {data.observaciones && (
        <section className="mt-6 text-sm">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Observaciones</div>
          <p className="whitespace-pre-wrap">{data.observaciones}</p>
        </section>
      )}

      <section className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          Este documento es una pre-orden y no constituye una factura. Un colaborador de la cooperativa dará seguimiento
          a tu solicitud y confirmará disponibilidad, precios y tiempos de entrega. Conserva el número{" "}
          <span className="font-mono font-semibold text-foreground">{data.numero_pedido}</span> para consultas.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div className="border-t border-foreground/60 pt-1">Firma del cliente</div>
          <div className="border-t border-foreground/60 pt-1">Atendido por</div>
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
