import { createFileRoute } from "@tanstack/react-router";
import { CotizacionPage } from "@/components/calculadora/CotizacionPage";

export const Route = createFileRoute("/cotizacion/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tu cotización · Línea Blanca Cooperativa GBD" },
      { name: "description", content: "Cotización de productos de Línea Blanca de la Cooperativa Gladys B. de Ducasa R.L. — válida por 30 días." },
      { property: "og:title", content: "Tu cotización de Línea Blanca" },
      { property: "og:description", content: "Consulta tu cotización con cuotas mensuales y quincenales." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CotizacionRoute,
});

function CotizacionRoute() {
  const { id } = Route.useParams();
  return <CotizacionPage id={id} />;
}
