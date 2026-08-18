import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { suscribirNewsletter } from "@/lib/newsletter.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const INTERESES = ["Línea Blanca", "Muebles", "Bordados", "Promociones"];

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const suscribir = useServerFn(suscribirNewsletter);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [intereses, setIntereses] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("Debes aceptar recibir nuestras comunicaciones.");
      return;
    }
    setBusy(true);
    try {
      await suscribir({ data: { email, nombre, telefono: "", intereses, consent: true } });
      setListo(true);
      toast.success("¡Listo! Te avisaremos de nuestras promociones.");
    } catch (err: any) {
      toast.error(err?.message ?? "No pudimos registrar tu correo");
    } finally {
      setBusy(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Mail className="mx-auto h-6 w-6 text-primary" />
        <p className="mt-2 font-display text-lg font-bold">¡Suscripción confirmada!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Recibirás nuestras promociones y anuncios en {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className={compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2"}>
        <div className="space-y-1.5">
          <Label htmlFor="nl-nombre">Nombre</Label>
          <Input
            id="nl-nombre"
            value={nombre}
            maxLength={120}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nl-email">Correo electrónico *</Label>
          <Input
            id="nl-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {INTERESES.map((i) => (
          <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={intereses.includes(i)}
              onCheckedChange={(v) =>
                setIntereses((prev) => (v ? [...prev, i] : prev.filter((x) => x !== i)))
              }
            />
            {i}
          </label>
        ))}
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
        <span>
          Acepto recibir promociones y anuncios de la Cooperativa GBD y el tratamiento de mis datos según la
          política de privacidad.
        </span>
      </label>

      <Button type="submit" disabled={busy || !email} className="w-full sm:w-auto">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        Suscribirme
      </Button>
    </form>
  );
}
