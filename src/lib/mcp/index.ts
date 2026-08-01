import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import listPromotionsTool from "./tools/list-promotions";
import getContactInfoTool from "./tools/get-contact-info";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "gbd-market-mcp",
  title: "GBD Market MCP",
  version: "0.1.0",
  instructions:
    "Tools to browse Cooperativa Gladys B. de Ducasa's Línea Blanca catalog, active promotions, and contact channels.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProductsTool, listPromotionsTool, getContactInfoTool],
});
