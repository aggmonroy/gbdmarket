import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Inicio" },
  { to: "/linea-blanca", label: "Línea Blanca" },
  { to: "/bordados", label: "Bordados" },
  { to: "/financiamiento", label: "Financiamiento" },
  { to: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-primary text-primary-foreground font-display font-bold">
            GD
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-foreground">Cooperativa Gladys B. de Ducasa</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Línea Blanca · Bordados</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  active ? "text-primary bg-primary-soft" : "text-foreground/80 hover:text-primary hover:bg-accent"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <a
            href="https://wa.me/50767841941"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition"
          >
            Cotizar ahora
          </a>
        </div>

        <button
          aria-label="Menú"
          onClick={() => setOpen(!open)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <a
              href="https://wa.me/50767841941"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
