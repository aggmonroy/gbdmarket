import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, Tags, Scissors, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel administrativo · Cooperativa GBD" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías y marcas", icon: Tags },
  { to: "/admin/bordados", label: "Bordados", icon: Scissors },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto grid lg:grid-cols-[240px_1fr] gap-6 px-4 py-6">
        <aside className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          <div className="px-3 pb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Panel admin</div>
            <div className="font-display font-bold text-foreground">Cooperativa GBD</div>
          </div>
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          <div className="pt-3 mt-3 border-t border-border space-y-1">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" />
              Ver sitio público
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
