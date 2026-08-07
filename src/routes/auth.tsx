import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapFirstAdmin, hasAnyAdmin } from "@/lib/admin.functions";
import { getAdminAccess } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s.next) }),
  head: () => ({
    meta: [
      { title: "Acceso administrativo · Cooperativa GBD" },
      { name: "description", content: "Ingreso privado al panel administrativo de la Cooperativa GBD." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const checkAdmin = useServerFn(hasAnyAdmin);
  const bootstrap = useServerFn(bootstrapFirstAdmin);
  const access = useServerFn(getAdminAccess);
  const { data: status, refetch } = useQuery({
    queryKey: ["has-admin"],
    queryFn: () => checkAdmin(),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const isBootstrap = status && !status.hasAdmin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isBootstrap) {
        await bootstrap({ data: { email, password } });
        toast.success("Administrador creado. Inicia sesión.");
        await refetch();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const state = await access();
      if (!state.isStaff) {
        await supabase.auth.signOut();
        throw new Error("Esta cuenta no tiene acceso al panel administrativo.");
      }

      toast.success("Sesión iniciada");
      if (next) window.location.href = next;
      else navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Te enviamos un correo para restablecer tu contraseña.");
      setRecovering(false);
    } catch (err: any) {
      toast.error(err?.message ?? "No pudimos enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  }

  if (recovering) {
    return (
      <div className="min-h-[80vh] grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-display text-2xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecover} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recover-email">Correo</Label>
                <Input
                  id="recover-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setRecovering(false)}
              >
                Volver al ingreso
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {isBootstrap ? "Configurar primer administrador" : "Acceso administrativo"}
          </CardTitle>
          <CardDescription>
            {isBootstrap
              ? "Crea la cuenta del primer administrador para gestionar el catálogo."
              : "Solo el personal autorizado de la cooperativa puede ingresar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isBootstrap ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : isBootstrap ? "Crear administrador" : "Ingresar"}
            </Button>
            {!isBootstrap && (
              <>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setRecovering(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ¿No tienes cuenta? Solicita una invitación a un administrador existente.
                </p>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
