import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapFirstAdmin, hasAnyAdmin } from "@/lib/admin.functions";
import { beginTwoFactor, completeTwoFactor, getAdminAccess } from "@/lib/admin-auth.functions";
import { getDeviceToken, clearDeviceToken, setDeviceToken, deviceLabel } from "@/lib/admin-device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

/** Acepta el código de 6 dígitos o el enlace completo copiado del correo. */
function parseCodeInput(raw: string): { token?: string; tokenHash?: string; type?: string } | null {
  const value = raw.trim();
  if (/^\d{6}$/.test(value)) return { token: value };
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const params = new URLSearchParams(
        url.search.startsWith("?") ? url.search.slice(1) : url.search,
      );
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const tokenHash = params.get("token_hash") ?? hash.get("token_hash") ?? params.get("token");
      const type = params.get("type") ?? hash.get("type") ?? "email";
      if (tokenHash) return { tokenHash, type };
    } catch {
      return null;
    }
  }
  return null;
}

/** Límites del segundo paso. */
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS = 3;
const MAX_VERIFY_ATTEMPTS = 5;

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
  const startTwoFactor = useServerFn(beginTwoFactor);
  const complete = useServerFn(completeTwoFactor);
  const { data: status, refetch } = useQuery({
    queryKey: ["has-admin"],
    queryFn: () => checkAdmin(),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resends, setResends] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_VERIFY_ATTEMPTS);
  const [blocked, setBlocked] = useState<string | null>(null);

  const isBootstrap = status && !status.hasAdmin;

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function resetTwoFactorState() {
    setSent(false);
    setCode("");
    setCooldown(0);
    setResends(0);
    setAttemptsLeft(MAX_VERIFY_ATTEMPTS);
    setBlocked(null);
  }



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

      // Paso 2: dispositivo reconocido o verificación por correo.
      const state = await access({ data: { deviceToken: getDeviceToken() } });
      if (!state.isStaff) {
        await supabase.auth.signOut();
        throw new Error("Esta cuenta no tiene acceso al panel administrativo.");
      }
      if (state.verified) {
        toast.success("Sesión iniciada en un dispositivo reconocido");
        if (next) window.location.href = next;
        else navigate({ to: "/admin" });
        return;
      }

      await startTwoFactor();
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (otpErr) throw otpErr;
      clearDeviceToken();
      // Sin verificación no hay acceso: cerramos la sesión de este paso.
      await supabase.auth.signOut();
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseCodeInput(code);
    if (!parsed) {
      toast.error("Ingresa el código de 6 dígitos del correo (o pega el enlace completo).");
      return;
    }
    setLoading(true);
    try {
      const { error } = parsed.token
        ? await supabase.auth.verifyOtp({ email, token: parsed.token, type: "email" })
        : await supabase.auth.verifyOtp({
            token_hash: parsed.tokenHash!,
            type: (parsed.type as "email" | "magiclink" | "recovery") ?? "email",
          });
      if (error) throw error;

      const { deviceToken } = await complete({ data: { label: deviceLabel() } });
      setDeviceToken(deviceToken);
      toast.success("Verificación completada");
      if (next) window.location.href = next;
      else navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Código inválido o vencido. Solicítalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    try {
      await startTwoFactor();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast.success("Enviamos un nuevo código a tu correo");
    } catch (err: any) {
      toast.error(err?.message ?? "No pudimos reenviar el código");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-display text-2xl">Verificación en 2 pasos</CardTitle>
            <CardDescription>
              Contraseña correcta. Enviamos un código de verificación a <strong>{email}</strong>.
              Escríbelo aquí para completar el ingreso; después este dispositivo quedará reconocido por 60 días.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="text-center text-lg tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si el correo solo trae un enlace, cópialo y pégalo aquí completo.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Verificar e ingresar"}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={resendCode}>
                  Reenviar código
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setSent(false);
                    setCode("");
                  }}
                >
                  Volver
                </Button>
              </div>
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
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Los administradores requieren verificación en 2 pasos.
                </p>
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
