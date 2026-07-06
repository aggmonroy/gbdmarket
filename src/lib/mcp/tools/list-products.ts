import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List published products",
  description:
    "List published línea blanca products from the store catalog. Returns name, brand, model, price, stock and category slug. Public data — no authentication required.",
  inputSchema: {
    category_slug: z
      .string()
      .optional()
      .describe("Optional category slug to filter (e.g. 'refrigeradoras')."),
    search: z.string().optional().describe("Optional text to match against product name, brand or model."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_slug, search, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("products")
      .select("id, name, brand, model, price_cash, stock, is_featured, categories(slug, name)")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).filter((r: any) =>
      !category_slug ? true : r.categories?.slug === category_slug,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { products: rows },
    };
  },
});
