import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeTwoFactor } from "@/lib/admin-auth.functions";
import { setDeviceToken, deviceLabel } from "@/lib/admin-device";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/auth/verificar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verificación en 2 pasos · Cooperativa GBD" },
      { name: "description", content: "Confirma tu ingreso al panel administrativo de la Cooperativa GBD." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const complete = useServerFn(completeTwoFactor);
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    async function finish() {
      // El enlace del correo crea la sesión; esperamos a que esté disponible.
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        session = await new Promise((resolve) => {
          const { data } = supabase.auth.onAuthStateChange((_e, s) => {
            if (s) {
              data.subscription.unsubscribe();
              resolve(s);
            }
          });
          setTimeout(() => {
            data.subscription.unsubscribe();
            resolve(null);
          }, 8000);
        });
      }
      if (cancelled) return;
      if (!session) {
        setError("No pudimos leer el enlace de verificación. Intenta ingresar de nuevo.");
        return;
      }
      try {
        const { deviceToken } = await complete({ data: { label: deviceLabel() } });
        setDeviceToken(deviceToken);
        navigate({ to: "/admin", replace: true });
      } catch (err: any) {
        await supabase.auth.signOut();
        setError(err?.message ?? "No se pudo completar la verificación.");
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [complete, navigate]);

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {error ? (
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          ) : (
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          )}
          <CardTitle className="font-display text-2xl">
            {error ? "Verificación no completada" : "Verificando tu identidad"}
          </CardTitle>
          <CardDescription>
            {error ?? "Estamos confirmando el segundo paso y registrando este dispositivo como reconocido."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Button className="w-full" onClick={() => navigate({ to: "/auth", search: { next: "" } })}>
              Volver al ingreso
            </Button>
          ) : (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
