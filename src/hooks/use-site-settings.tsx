import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo } from "react";
import { getAllSettingsPublic } from "@/lib/site-settings.functions";

export interface SiteSettings {
  branding?: {
    site_name?: string;
    site_tagline?: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    accent_color?: string;
  };
  seo?: {
    meta_title?: string;
    meta_description?: string;
    og_image_url?: string;
    google_analytics_id?: string;
    meta_pixel_id?: string;
    extra_head_html?: string;
  };
  contact?: {
    email?: string;
    whatsapp_lineablanca?: string;
    whatsapp_bordados?: string;
    branches?: Array<{ name: string; phone: string; address: string; maps_url: string }>;
    socials?: Array<{ label: string; url: string }>;
  };
}

const EMPTY: SiteSettings = {};

/** Fetches all published site settings (cached for 5 min). */
export function useSiteSettings(): SiteSettings {
  const fn = useServerFn(getAllSettingsPublic);
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  return (data as SiteSettings) ?? EMPTY;
}

/** Injects branding colors, favicon and analytics scripts into <head>. */
export function SiteSettingsInjector() {
  const settings = useSiteSettings();
  const branding = settings.branding;
  const seo = settings.seo;

  const styleCss = useMemo(() => {
    const parts: string[] = [];
    if (branding?.primary_color) parts.push(`--primary: ${branding.primary_color};`);
    if (branding?.accent_color) parts.push(`--accent: ${branding.accent_color};`);
    return parts.length ? `:root{${parts.join("")}}` : "";
  }, [branding?.primary_color, branding?.accent_color]);

  useEffect(() => {
    if (!styleCss) return;
    const el = document.createElement("style");
    el.dataset.siteSettings = "colors";
    el.textContent = styleCss;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [styleCss]);

  useEffect(() => {
    if (!branding?.favicon_url) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']") ?? Object.assign(document.createElement("link"), { rel: "icon" });
    link.href = branding.favicon_url;
    if (!link.parentElement) document.head.appendChild(link);
  }, [branding?.favicon_url]);

  useEffect(() => {
    const gaId = seo?.google_analytics_id?.trim();
    if (!gaId) return;
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    const s2 = document.createElement("script");
    s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.append(s1, s2);
    return () => { s1.remove(); s2.remove(); };
  }, [seo?.google_analytics_id]);

  useEffect(() => {
    const pid = seo?.meta_pixel_id?.trim();
    if (!pid) return;
    const s = document.createElement("script");
    s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pid}');fbq('track','PageView');`;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [seo?.meta_pixel_id]);

  useEffect(() => {
    const html = seo?.extra_head_html?.trim();
    if (!html) return;
    const container = document.createElement("div");
    container.innerHTML = html;
    const nodes = Array.from(container.childNodes);
    nodes.forEach((n) => document.head.appendChild(n));
    return () => { nodes.forEach((n) => n.parentElement?.removeChild(n)); };
  }, [seo?.extra_head_html]);

  return null;
}
