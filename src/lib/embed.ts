import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const KEY = "gbd.embed";

/**
 * Modo embebido: cuando la página se abre con `?embed=1` (dentro de una caja
 * en coopgbd.com) se ocultan la cabecera, el pie de página, el WhatsApp
 * flotante y el botón de instalar la app. La preferencia se recuerda en la
 * pestaña para que la navegación interna (catálogo, boletín) siga viéndose
 * limpia. `?embed=0` desactiva el modo.
 */
export function EmbedModeManager() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("embed") === "1") window.sessionStorage.setItem(KEY, "1");
      if (params.get("embed") === "0") window.sessionStorage.removeItem(KEY);
      const activo = window.sessionStorage.getItem(KEY) === "1";
      document.documentElement.classList.toggle("embed", activo);
      if (activo && !document.querySelector('meta[name="robots"]')) {
        // La versión embebida no debe indexarse: es una copia del contenido real.
        const meta = document.createElement("meta");
        meta.name = "robots";
        meta.content = "noindex";
        document.head.appendChild(meta);
      }
    } catch {
      /* Sin almacenamiento disponible: el modo no se activa. */
    }
  }, [searchStr]);

  return null;
}
