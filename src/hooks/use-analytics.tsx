import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "gbd_sid";
const EVENT_TYPES = ["page_view", "product_view", "whatsapp_click", "form_submit", "cta_click", "quote_click"] as const;
type EventType = (typeof EVENT_TYPES)[number];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

async function insertEvent(payload: Record<string, any>) {
  try {
    await supabase.from("page_events").insert(payload as any);
  } catch {
    /* silent */
  }
}

export async function trackInteraction(
  event_type: EventType,
  extra: { product_id?: string; category_slug?: string; path?: string; meta?: Record<string, any> } = {},
) {
  if (typeof window === "undefined") return;
  await insertEvent({
    event_type,
    path: extra.path ?? window.location.pathname,
    product_id: extra.product_id,
    category_slug: extra.category_slug,
    referrer: document.referrer?.slice(0, 500) || null,
    session_id: getSessionId(),
    user_agent: navigator.userAgent.slice(0, 400),
    meta: extra.meta ?? null,
  });
}

/** Fire a page_view on every route change. Skips /admin/*, /auth. */
export function useAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    void trackInteraction("page_view", { path: pathname });
  }, [pathname]);
}
