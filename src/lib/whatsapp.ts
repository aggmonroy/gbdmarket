import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_LINEA_BLANCA = "50767841941";
export const WHATSAPP_BORDADOS = "50768298538";
export const EMAIL_LINEA_BLANCA = "lineablanca@coopgbd.com";

export type WaChannel = "linea-blanca" | "bordados";

export function buildWaUrl(channel: WaChannel, message: string) {
  const phone = channel === "bordados" ? WHATSAPP_BORDADOS : WHATSAPP_LINEA_BLANCA;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function logLead(input: {
  channel: WaChannel;
  product_id?: string | null;
  product_name?: string | null;
  customer_name?: string | null;
  term_months?: number | null;
  total_price?: number | null;
}) {
  try {
    await supabase.from("whatsapp_leads").insert(input);
  } catch (e) {
    console.warn("lead log failed", e);
  }
}

export function defaultGreeting(channel: WaChannel) {
  return channel === "bordados"
    ? "Hola, deseo cotizar un trabajo de bordado con la Cooperativa Gladys B. de Ducasa R.L."
    : "Hola, deseo información sobre los productos de Línea Blanca de la Cooperativa Gladys B. de Ducasa R.L.";
}
