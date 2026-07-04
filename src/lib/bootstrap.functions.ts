import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * One-off admin bootstrap. Protected by ADMIN_BOOTSTRAP_TOKEN env secret.
 * Creates (or updates the password of) an auth user and assigns the admin role.
 * Safe to call multiple times — idempotent.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string; token: string }) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        token: z.string().min(8),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected) throw new Error("ADMIN_BOOTSTRAP_TOKEN not configured");
    if (data.token !== expected) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin: any = supabaseAdmin;

    // Find existing user by email
    let userId: string | undefined;
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.data?.users?.find((u: any) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (found) {
      userId = found.id;
      await admin.auth.admin.updateUserById(userId, { password: data.password, email_confirm: true });
    } else {
      const created = await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (created.error) throw new Error(created.error.message);
      userId = created.data.user!.id;
    }

    // Assign admin role (idempotent via unique constraint)
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" },
    );

    return { ok: true, userId, email: data.email };
  });
