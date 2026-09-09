import { createServerFn } from "@tanstack/react-start";

const CUENTAS = ["gbdmuebleria", "bordadosgbd", "coopgladysducasa"] as const;

const FALLBACK: Record<(typeof CUENTAS)[number], string[]> = {
  gbdmuebleria: ["DcjByxKxkgr", "DZN7UJ4JsKo", "DY4z_WFR35v", "DYza-9FRGaG"],
  bordadosgbd: ["Dai6PpEvPPE", "DW6n0v1kvVb", "DW6nzQCknKW", "DW6nvsjklSb"],
  coopgladysducasa: ["DdEmElwRK7n", "DdCdMRgJ_qX", "DdCBkgZx3gG", "Dc_78Wwp7i2"],
};

export const getInstagramPosts = createServerFn({ method: "GET" }).handler(async () => {
  const entries = await Promise.all(
    CUENTAS.map(async (usuario) => {
      try {
        const response = await fetch(`https://www.instagram.com/${usuario}/embed`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!response.ok) return [usuario, FALLBACK[usuario]] as const;

        const html = await response.text();
        const matches = [...html.matchAll(/\\"shortcode\\":\\"([^\\"]+)/g)].map((match) => match[1]);
        const shortcodes = [...new Set(matches)].slice(0, 8);
        return [usuario, shortcodes.length ? shortcodes : FALLBACK[usuario]] as const;
      } catch {
        return [usuario, FALLBACK[usuario]] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as Record<(typeof CUENTAS)[number], string[]>;
});