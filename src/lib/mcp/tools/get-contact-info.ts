import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_contact_info",
  title: "Get contact info",
  description:
    "Return WhatsApp numbers and channels to contact Cooperativa Gladys B. de Ducasa's Línea Blanca and Bordados departments.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          "Línea Blanca WhatsApp: +507 6784-1941",
          "Bordados WhatsApp: +507 6829-8538",
          "Sitio: https://gbdmarket.lovable.app",
        ].join("\n"),
      },
    ],
    structuredContent: {
      whatsapp: {
        linea_blanca: "+50767841941",
        bordados: "+50768298538",
      },
      website: "https://gbdmarket.lovable.app",
    },
  }),
});
