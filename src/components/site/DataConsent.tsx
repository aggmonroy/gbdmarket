import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";

export function DataConsent({
  accepted,
  onChange,
  id = "data-consent",
}: {
  accepted: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs cursor-pointer">
      <Checkbox
        id={id}
        checked={accepted}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5"
      />
      <span className="leading-relaxed text-foreground/85">
        Acepto el tratamiento de mis datos personales para atender esta solicitud (cotización, venta, garantía o atención al
        cliente), conforme a la{" "}
        <Link to="/privacidad" target="_blank" className="text-primary font-medium hover:underline">
          Política de Privacidad
        </Link>
        . Mis datos no se compartirán salvo obligación legal.
      </span>
    </label>
  );
}
