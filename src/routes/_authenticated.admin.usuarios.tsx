import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { listStaff, setUserRole, inviteStaff, revokeStaff } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "admin" | "editor" | "viewer";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Solo lectura",
  user: "Sin permisos",
};

const ROLE_HELP: Record<Role, string> = {
  admin: "Acceso total: contenido, usuarios y configuración. Requiere verificación en 2 pasos.",
  editor: "Puede consultar el panel; los cambios los aprueba un administrador.",
  viewer: "Solo consulta de información del panel.",
};

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y roles · Panel Cooperativa GBD" },
      { name: "description", content: "Administra las cuentas del personal y sus permisos." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const qc = useQueryClient();
  const staffFn = useServerFn(listStaff);
  const setRoleFn = useServerFn(setUserRole);
  const inviteFn = useServerFn(inviteStaff);
  const revokeFn = useServerFn(revokeStaff);

  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => staffFn() });


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("editor");

  const invite = useMutation({
    mutationFn: () => inviteFn({ data: { email, password, role } }),
    onSuccess: () => {
      toast.success("Cuenta creada");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo crear la cuenta"),
  });

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: Role }) => setRoleFn({ data: v }),
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar el rol"),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => revokeFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Acceso revocado");
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo revocar el acceso"),
  });




  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground">
          Solo los administradores pueden hacer cambios en el sitio. Editor y solo lectura tienen acceso de consulta.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal con acceso</CardTitle>
          <CardDescription>{isLoading ? "Cargando..." : `${staff.length} cuenta(s)`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{s.email}</div>
                <div className="text-xs text-muted-foreground">
                  {ROLE_LABEL[s.role] ?? s.role}
                </div>

              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={["admin", "editor", "viewer"].includes(s.role) ? s.role : "viewer"}
                  onValueChange={(v) => changeRole.mutate({ userId: s.user_id, role: v as Role })}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Solo lectura</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Revocar acceso de ${s.email}`}
                  onClick={() => revoke.mutate(s.user_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear cuenta de personal</CardTitle>
          <CardDescription>{ROLE_HELP[role]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1fr_170px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-email">Correo</Label>
              <Input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña temporal</Label>
              <Input
                id="new-password"
                type="text"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Creando..." : "Crear"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
