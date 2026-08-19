import { createFileRoute, Outlet, Link, useRouterState, useNavigate, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Package, Tags, Scissors, LogOut, ExternalLink, FileText, Palette, Search, Phone, Tag, FileClock, GitPullRequest, Eye, BarChart3, ClipboardList, CalendarDays, Sparkles, KeyRound, Users, Images, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDraftMode } from "@/hooks/use-draft-mode";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPendingDrafts } from "@/lib/drafts.functions";
import { getAdminAccess } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const state = await getAdminAccess();
    if (!state.isStaff) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { next: "" } });
    }
    return { role: state.role, canEdit: state.canEdit };
  },
  head: () => ({
    meta: [
      { title: "Panel administrativo · Cooperativa GBD" },
      { name: "description", content: "Panel privado de gestión de la Cooperativa GBD." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});


const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bitacora", label: "Bitácora", icon: ClipboardList },
  { to: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías y marcas", icon: Tags },
  { to: "/admin/promociones", label: "Promociones", icon: Tag },
  { to: "/admin/galeria", label: "Galería del inicio", icon: Images },
  { to: "/admin/contenido", label: "Contenido del sitio", icon: FileText },
  { to: "/admin/branding", label: "Marca y colores", icon: Palette },
  { to: "/admin/contacto", label: "Contacto y redes", icon: Phone },
  { to: "/admin/seo", label: "SEO y analítica", icon: Search },
  { to: "/admin/colaboradores", label: "Colaboradores y PIN", icon: KeyRound },
  { to: "/admin/usuarios", label: "Usuarios y roles", icon: Users },
  { to: "/admin/newsletter", label: "Boletín / Newsletter", icon: Mail },
  { to: "/admin/bordados-servicios", label: "Bordados: servicios", icon: Sparkles },
  { to: "/admin/bordados", label: "Bordados: solicitudes", icon: Scissors },
];

const workflowNav = [
  { to: "/admin/cambios", label: "Cambios pendientes", icon: GitPullRequest, badge: true },
  { to: "/admin/preview", label: "Vista previa", icon: Eye },
  { to: "/admin/auditoria", label: "Auditoría", icon: FileClock },
  { to: "/admin/reportes", label: "Reporte de uso", icon: BarChart3 },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [draftMode, setDraftMode] = useDraftMode();
  const pendingFn = useServerFn(listPendingDrafts);
  const { data: pending = [] } = useQuery({
    queryKey: ["pending-drafts"],
    queryFn: () => pendingFn(),
    refetchInterval: 30000,
  });

  async function signOut() {
    // El dispositivo sigue reconocido; solo se cierra la sesión.
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { next: "" }, replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto grid lg:grid-cols-[240px_1fr] gap-6 px-4 py-6">
        <aside className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          <div className="px-3 pb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Panel admin</div>
            <div className="font-display font-bold text-foreground">Cooperativa GBD</div>
          </div>

          <div className="mx-1 mb-3 rounded-md border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Modo borrador</div>
              <Switch checked={draftMode} onCheckedChange={setDraftMode} />
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {draftMode
                ? "Los cambios se guardan como borrador y no se muestran en el sitio hasta que los publiques."
                : "Los cambios se publican inmediatamente en el sitio."}
            </p>
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

          <div className="pt-3 mt-3 border-t border-border">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Publicación</div>
            {workflowNav.map((n) => {
              const active = pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </span>
                  {n.badge && pending.length > 0 && (
                    <Badge variant={active ? "secondary" : "default"} className="h-5 px-1.5 text-[10px]">{pending.length}</Badge>
                  )}
                </Link>
              );
            })}
          </div>

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
