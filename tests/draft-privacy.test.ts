/**
 * Verifies that draft columns on content_blocks, products, and site_settings
 * are NOT readable via the anon (publishable) key, and ARE readable via the
 * service-role admin key.
 *
 * Run with: bun x vitest run
 *
 * Requires the following env vars to be present (loaded from .env by Vite/Vitest):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (optional — admin checks are skipped when missing)
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Manually parse .env because vitest doesn't preload VITE_ vars by default.
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
const admin = url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

describe("Draft column privacy for anonymous readers", () => {
  it("environment is configured", () => {
    expect(url, "VITE_SUPABASE_URL missing").toBeTruthy();
    expect(anonKey, "VITE_SUPABASE_PUBLISHABLE_KEY missing").toBeTruthy();
  });

  it.runIf(!!anon)("content_blocks: anon cannot select draft_data / has_draft", async () => {
    const { error } = await anon!.from("content_blocks").select("id, draft_data, has_draft").limit(1);
    expect(error).toBeTruthy();
    expect(String(error?.message ?? "").toLowerCase()).toMatch(/permission|column|not.*allow/);
  });

  it.runIf(!!anon)("products: anon cannot select draft_data / has_draft", async () => {
    const { error } = await anon!.from("products").select("id, draft_data, has_draft").limit(1);
    expect(error).toBeTruthy();
  });

  it.runIf(!!anon)("site_settings: anon cannot select draft_value / has_draft", async () => {
    const { error } = await anon!.from("site_settings").select("key, draft_value, has_draft").limit(1);
    expect(error).toBeTruthy();
  });

  it.runIf(!!anon)("content_blocks: anon CAN select safe columns", async () => {
    const { error } = await anon!.from("content_blocks").select("id, key, title, is_active").limit(1);
    expect(error).toBeFalsy();
  });

  it.runIf(!!anon)("products: anon CAN select safe columns for published rows", async () => {
    const { error } = await anon!.from("products").select("id, name, price_cash").eq("is_published", true).limit(1);
    expect(error).toBeFalsy();
  });

  it.runIf(!!anon)("site_settings: anon CAN select safe columns", async () => {
    const { error } = await anon!.from("site_settings").select("key, value").limit(1);
    expect(error).toBeFalsy();
  });
});

describe("Admin (service_role) can read draft columns", () => {
  it.runIf(!!admin)("content_blocks: admin reads draft_data", async () => {
    const { error } = await admin!.from("content_blocks").select("id, draft_data, has_draft").limit(1);
    expect(error).toBeFalsy();
  });
  it.runIf(!!admin)("products: admin reads draft_data", async () => {
    const { error } = await admin!.from("products").select("id, draft_data, has_draft").limit(1);
    expect(error).toBeFalsy();
  });
  it.runIf(!!admin)("site_settings: admin reads draft_value", async () => {
    const { error } = await admin!.from("site_settings").select("key, draft_value, has_draft").limit(1);
    expect(error).toBeFalsy();
  });
  it.skipIf(!!admin)("service_role key not provided → admin checks skipped", () => {
    expect(true).toBe(true);
  });
});
