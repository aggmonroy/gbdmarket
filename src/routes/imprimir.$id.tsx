import { createFileRoute } from "@tanstack/react-router";
import { ImprimirPage } from "@/components/calculadora/ImprimirPage";

export const Route = createFileRoute("/imprimir/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Documento para imprimir · Cooperativa GBD" },
      { name: "description", content: "Documento de cotización de Línea Blanca listo para imprimir o descargar en PDF." },
      { property: "og:title", content: "Documento de cotización para imprimir" },
      { property: "og:description", content: "Versión imprimible de la cotización de Línea Blanca." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ImprimirRoute,
});

function ImprimirRoute() {
  const { id } = Route.useParams();
  return <ImprimirPage id={id} />;
}
