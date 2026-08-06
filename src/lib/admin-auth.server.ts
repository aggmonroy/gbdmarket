// Server-only helpers for admin authentication (roles, 2FA challenges, trusted devices).
import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AdminRole } from "./admin-auth.functions";

const CHALLENGE_TTL_MINUTES = 15;
const DEVICE_TTL_DAYS = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Highest-privilege role of a user, or null when the user has no staff role. */
export async function getRoleFor(userId: string): Promise<AdminRole | null> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role as AdminRole);
  for (const r of ["admin", "editor", "viewer", "user"] as const) {
    if (roles.includes(r)) return r;
  }
  return null;
}

/** Opens a 2-step verification challenge (password already accepted). */
export async function openChallenge(userId: string): Promise<void> {
  const expires = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60_000).toISOString();
  const { error } = await supabaseAdmin
    .from("admin_login_challenges")
    .insert({ user_id: userId, expires_at: expires });
  if (error) throw new Error(error.message);
}

/** Consumes the newest valid challenge. Returns false when none is pending. */
export async function consumeChallenge(userId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("admin_login_challenges")
    .select("id")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const challenge = data?.[0];
  if (!challenge) return false;
  const { error: uErr } = await supabaseAdmin
    .from("admin_login_challenges")
    .update({ consumed_at: nowIso })
    .eq("id", challenge.id);
  if (uErr) throw new Error(uErr.message);
  return true;
}

/** Registers the current device as recognised. Returns the raw device token once. */
export async function trustDevice(userId: string, label: string | null): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const { error } = await supabaseAdmin.from("admin_trusted_devices").insert({
    user_id: userId,
    token_hash: hashToken(token),
    label,
    expires_at: new Date(Date.now() + DEVICE_TTL_DAYS * 864e5).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

/** True when the token matches a non-expired recognised device of the user. */
export async function isTrustedDevice(userId: string, token: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_trusted_devices")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("token_hash", hashToken(token))
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  await supabaseAdmin
    .from("admin_trusted_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", row.id);
  return true;
}
