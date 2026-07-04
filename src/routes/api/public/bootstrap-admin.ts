import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  token: z.string().min(8),
});

/**
 * One-off admin bootstrap route.
 * Gated by ADMIN_BOOTSTRAP_TOKEN env secret in the request body.
 * Creates (or updates the password of) an auth user and grants admin role.
 * Idempotent — safe to call multiple times.
 *
 *   POST /api/public/bootstrap-admin
 *   { "email": "...", "password": "...", "token": "..." }
 */
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
        if (!expected) {
          return new Response(JSON.stringify({ error: "ADMIN_BOOTSTRAP_TOKEN not configured" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        let payload: z.infer<typeof bodySchema>;
        try {
          payload = bodySchema.parse(await request.json());
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e?.message ?? "invalid body" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        if (payload.token !== expected) {
          return new Response(JSON.stringify({ error: "forbidden" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin: any = supabaseAdmin;

        // Find existing user by email
        let userId: string | undefined;
        const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.data?.users?.find(
          (u: any) => u.email?.toLowerCase() === payload.email.toLowerCase(),
        );
        if (found) {
          userId = found.id;
          await admin.auth.admin.updateUserById(userId, {
            password: payload.password,
            email_confirm: true,
          });
        } else {
          const created = await admin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
          });
          if (created.error) {
            return new Response(JSON.stringify({ error: created.error.message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }
          userId = created.data.user!.id;
        }

        // Assign admin role (idempotent via composite unique)
        const { error: roleErr } = await admin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (roleErr) {
          return new Response(JSON.stringify({ error: roleErr.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true, userId, email: payload.email }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
