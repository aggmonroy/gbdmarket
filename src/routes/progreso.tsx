import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgresoCotizador } from "@/components/progreso/ProgresoCotizador";
import { CLAVE_PROGRESO, PUNTO_VENTA_PROGRESO } from "@/lib/progreso";

export const Route = createFileRoute("/progreso")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cotizaciones El Progreso · Convenio comercial GBD" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content:
          "Cotizador del punto de venta Cooperativa El Progreso R.L. con precio de etiqueta, margen y plazo propios. Nada se guarda.",
      },
      { property: "og:title", content: "Cotizaciones El Progreso" },
      { property: "og:description", content: "Cotizador independiente del punto de venta El Progreso." },
    ],
  }),
  component: ProgresoRoute,
});

function ProgresoRoute() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k");
    setAutorizado(k === CLAVE_PROGRESO);
  }, []);

  if (autorizado === null) return null;

  if (!autorizado)
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <KeyRound className="h-5 w-5 text-primary" /> Enlace no válido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Este cotizador es exclusivo del punto de venta {PUNTO_VENTA_PROGRESO.nombre}. Solicita el enlace de acceso
            autorizado.
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 className="font-display text-2xl font-bold">Cotizaciones {PUNTO_VENTA_PROGRESO.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {PUNTO_VENTA_PROGRESO.atencion} · WhatsApp {PUNTO_VENTA_PROGRESO.whatsappVisible}. Las cotizaciones no se
            guardan en GBD Market: al cerrarlas desaparecen.
          </p>
        </header>
        <ProgresoCotizador />
      </div>
    </div>
  );
}
