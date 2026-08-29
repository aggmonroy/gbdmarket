/**
 * Socios aliados (puntos de venta externos).
 *
 * Un socio comparte el catálogo con un enlace especial (`/catalogo?socio=<slug>`).
 * Mientras el enlace esté activo en el navegador, todas las cotizaciones y clics
 * de WhatsApp se dirigen al número del socio y NO se registran en nuestro portal,
 * para evitar duplicidad de seguimiento.
 */
export type Socio = {
  slug: string;
  nombre: string;
  whatsapp: string;
  descripcion: string;
};

export const SOCIOS: Socio[] = [
  {
    slug: "el-progreso",
    nombre: "Cooperativa El Progreso",
    whatsapp: "50766848849",
    descripcion: "Punto de venta aliado · precios y cotizaciones gestionadas por El Progreso",
  },
];

const STORAGE_KEY = "gbd_socio";

export function buscarSocio(slug?: string | null) {
  if (!slug) return null;
  return SOCIOS.find((s) => s.slug === slug.trim().toLowerCase()) ?? null;
}

/** Guarda el socio del enlace para que se mantenga durante la navegación. */
export function activarSocio(slug: string) {
  const socio = buscarSocio(slug);
  if (!socio || typeof window === "undefined") return null;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, socio.slug);
  } catch {
    /* almacenamiento no disponible */
  }
  return socio;
}

/** Socio activo en esta sesión del navegador (null = catálogo propio de GBD). */
export function socioActivo(): Socio | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URLSearchParams(window.location.search).get("socio");
    if (url) return buscarSocio(url);
    return buscarSocio(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Enlace compartible del catálogo para un socio. */
export function enlaceSocio(slug: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/catalogo?socio=${encodeURIComponent(slug)}`;
}
