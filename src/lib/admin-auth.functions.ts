import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRole = "admin" | "editor" | "viewer" | "user";

/**
 * Access + 2FA state for the signed-in user.
 * `verified` is true when the current device is a recognised (trusted) device.
 */
export const getAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceToken?: string | null }) =>
    z.object({ deviceToken: z.string().max(200).nullish() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { getRoleFor, isTrustedDevice } = await import("@/lib/admin-auth.server");
    const role = await getRoleFor(context.userId);
    const verified = data.deviceToken ? await isTrustedDevice(context.userId, data.deviceToken) : false;
    return {
      role,
      isStaff: role !== null,
      canEdit: role === "admin",
      requiresTwoFactor: role === "admin",
      verified: role === "admin" ? verified : role !== null,
    };
  });

/** Step 2 of 2: opens a verification challenge after the password was accepted. */
export const beginTwoFactor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRoleFor, openChallenge } = await import("@/lib/admin-auth.server");
    const role = await getRoleFor(context.userId);
    if (role === null) throw new Error("Esta cuenta no tiene acceso administrativo.");
    if (role !== "admin") return { required: false as const };
    await openChallenge(context.userId);
    return { required: true as const };
  });

/**
 * Completes verification: only valid when a challenge was opened with the
 * password in this login attempt. Returns a one-time device token.
 */
export const completeTwoFactor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { label?: string | null }) =>
    z.object({ label: z.string().max(120).nullish() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { consumeChallenge, trustDevice } = await import("@/lib/admin-auth.server");
    const ok = await consumeChallenge(context.userId);
    if (!ok) {
      throw new Error(
        "El enlace de verificación venció o no corresponde a un inicio de sesión con contraseña. Ingresa de nuevo.",
      );
    }
    const deviceToken = await trustDevice(context.userId, data.label ?? null);
    return { deviceToken };
  });

/** Recognised devices for the signed-in admin. */
export const listTrustedDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_trusted_devices")
      .select("id, label, last_seen_at, expires_at, created_at")
      .eq("user_id", context.userId)
      .order("last_seen_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Revokes one recognised device of the signed-in admin. */
export const revokeTrustedDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_trusted_devices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
