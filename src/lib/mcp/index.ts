import { defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import listPromotionsTool from "./tools/list-promotions";
import getContactInfoTool from "./tools/get-contact-info";

export default defineMcp({
  name: "gbd-market-mcp",
  title: "GBD Market MCP",
  version: "0.1.0",
  instructions:
    "Tools to browse Cooperativa Gladys B. de Ducasa's Línea Blanca catalog, active promotions, and contact channels.",
  tools: [listProductsTool, listPromotionsTool, getContactInfoTool],
});
