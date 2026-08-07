import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRole = "admin" | "editor" | "viewer" | "user";

/** Acceso del usuario autenticado: rol y permisos de edición. */
export const getAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRoleFor } = await import("@/lib/admin-auth.server");
    const role = await getRoleFor(context.userId);
    return {
      role,
      isStaff: role !== null,
      canEdit: role === "admin",
    };
  });
