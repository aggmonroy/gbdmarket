import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canjearPaseCotizacion } from "@/lib/garantias.functions";
import { AsesorPage } from "@/components/calculadora/AsesorPage";

export const Route = createFileRoute("/cotizar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cotizaciones internas · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "Acceso directo para colaboradores autorizados a la calculadora de cotizaciones de la Cooperativa GBD.",
      },
    ],
  }),
  component: CotizarDirecto,
});

function CotizarDirecto() {
  const canjear = useServerFn(canjearPaseCotizacion);
  const [token, setToken] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pase = new URLSearchParams(window.location.search).get("k");
    if (!pase) {
      setError("Este enlace no es válido. Solicita a un administrador tu enlace de acceso.");
      return;
    }
    (canjear({ data: { pase } }) as Promise<any>)
      .then((r) => {
        setToken(r.token);
        setNombre(r.colaborador?.nombre ?? "");
      })
      .catch((e: any) => setError(e?.message ?? "Enlace de acceso no válido"));
  }, [canjear]);

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <KeyRound className="h-5 w-5 text-primary" /> Acceso restringido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{error}</p>
            <Button asChild variant="outline">
              <Link to="/portal">Ingresar con cédula y PIN</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  if (!token)
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando tu enlace…
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {nombre && <p className="text-sm text-muted-foreground">Acceso directo de {nombre}</p>}
        <AsesorPage token={token} permitirBordados />
      </div>
    </div>
  );
}
