/** Lectura con IA de la ficha de un producto desde el enlace del proveedor. */

const FICHA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    brand: { type: "string" },
    model: { type: "string" },
    code: { type: "string" },
    categoria: { type: "string" },
    description: { type: "string" },
    features: { type: "array", items: { type: "string" } },
    images: { type: "array", items: { type: "string" } },
  },
  required: ["name", "brand", "model", "code", "categoria", "description", "features", "images"],
} as const;

export type FichaProducto = {
  name: string;
  brand: string;
  model: string;
  code: string;
  categoria: string;
  description: string;
  features: string[];
  images: string[];
};

function textoDePagina(html: string) {
  const imgs = [...html.matchAll(/<img[^>]+(?:data-)?src=["']([^"']+)["']/gi)]
    .map((m) => m[1]!)
    .filter((u) => /^https?:\/\//i.test(u) && !/sprite|icon|logo|pixel/i.test(u))
    .slice(0, 12);
  const og = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)].map((m) => m[1]!);
  const texto = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18000);
  return { texto, imagenes: [...new Set([...og, ...imgs])].slice(0, 10) };
}

export async function leerFichaDesdeUrl(url: string, categorias: string[]): Promise<FichaProducto> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la configuración de IA en el servidor");

  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; GBDMarketBot/1.0)", accept: "text/html,*/*" },
    redirect: "follow",
  }).catch(() => null);
  if (!res || !res.ok) throw new Error("No se pudo leer la página del proveedor. Revisa el enlace.");
  const html = await res.text();
  const { texto, imagenes } = textoDePagina(html);
  if (texto.length < 80) throw new Error("La página del proveedor no devolvió contenido legible.");

  const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de catálogo de una cooperativa panameña. A partir del contenido de una página de proveedor, extrae la ficha del producto en español de Panamá. No inventes datos: si un dato no aparece, devuelve una cadena vacía. Las características deben ser frases cortas, una por elemento. Nunca incluyas precios.",
        },
        {
          role: "user",
          content: `Categorías disponibles (elige la más adecuada por nombre exacto, o cadena vacía): ${categorias.join(", ")}\n\nImágenes detectadas:\n${imagenes.join("\n")}\n\nContenido de la página (${url}):\n${texto}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "ficha_producto", strict: true, schema: FICHA_SCHEMA },
      },
    }),
  });

  if (ai.status === 429) throw new Error("La IA está ocupada en este momento. Intenta de nuevo en unos segundos.");
  if (ai.status === 402) throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
  if (!ai.ok) throw new Error(`No se pudo generar la ficha (${ai.status}). ${(await ai.text()).slice(0, 200)}`);

  const json: any = await ai.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("La IA no devolvió una ficha válida");
  const ficha = JSON.parse(raw) as FichaProducto;
  return {
    name: (ficha.name ?? "").slice(0, 200),
    brand: (ficha.brand ?? "").slice(0, 80),
    model: (ficha.model ?? "").slice(0, 80),
    code: (ficha.code ?? "").slice(0, 80),
    categoria: ficha.categoria ?? "",
    description: (ficha.description ?? "").slice(0, 4000),
    features: (ficha.features ?? []).filter(Boolean).slice(0, 25).map((f) => String(f).slice(0, 300)),
    images: (ficha.images ?? []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 6),
  };
}
