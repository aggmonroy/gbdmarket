import { PackageCheck, Clock } from "lucide-react";

export function DisponibilidadBadge({
  disponibilidad,
  size = "sm",
}: {
  disponibilidad?: string | null;
  size?: "sm" | "md";
}) {
  const enStock = disponibilidad === "en_stock";
  const Icon = enStock ? PackageCheck : Clock;
  const label = enStock ? "Disponible para entrega inmediata" : "Compra bajo pedido";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full font-semibold " +
        (size === "md" ? "px-3 py-1 text-xs " : "px-2 py-0.5 text-[11px] ") +
        (enStock
          ? "bg-primary-soft text-primary"
          : "bg-muted text-muted-foreground")
      }
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {label}
    </span>
  );
}
