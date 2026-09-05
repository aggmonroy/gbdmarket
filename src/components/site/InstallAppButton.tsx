import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { trackInteraction } from "@/hooks/use-analytics";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function plataforma(): string {
  if (typeof navigator === "undefined") return "desconocida";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  return "Escritorio";
}

/** Registra la instalación una sola vez por dispositivo. */
function registrarInstalacion(via: string) {
  try {
    if (window.localStorage.getItem("gbd_pwa_installed") === "1") return;
    window.localStorage.setItem("gbd_pwa_installed", "1");
  } catch { /* ignore */ }
  void trackInteraction("pwa_install", { meta: { plataforma: plataforma(), via } });
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BIPEvent | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalada(Boolean(standalone));
    if (standalone) {
      try {
        const key = "gbd_pwa_launch_day";
        const hoy = new Date().toISOString().slice(0, 10);
        if (window.localStorage.getItem(key) !== hoy) {
          window.localStorage.setItem(key, hoy);
          void trackInteraction("pwa_launch", { meta: { plataforma: plataforma() } });
        }
      } catch { /* ignore */ }
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalada(true);
      setPromptEvent(null);
      registrarInstalacion("appinstalled");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (instalada) return null;

  const handleClick = async () => {
    if (promptEvent) {
      void trackInteraction("pwa_prompt", { meta: { modo: "nativo", plataforma: plataforma() } });
      await promptEvent.prompt();
      const res = await promptEvent.userChoice.catch(() => null);
      if (res?.outcome === "accepted") {
        setInstalada(true);
        registrarInstalacion("prompt");
      } else {
        void trackInteraction("pwa_dismiss", { meta: { plataforma: plataforma() } });
      }
      setPromptEvent(null);
      return;
    }
    void trackInteraction("pwa_prompt", { meta: { modo: "manual", plataforma: plataforma() } });
    setAyuda(true);
  };

  const esIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Descargar app"
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-900 shadow-lg hover:bg-amber-300 transition ${className}`}
      >
        <Download className="h-3.5 w-3.5" />
        Descargar app
      </button>

      {ayuda && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setAyuda(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-left shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAyuda(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-display text-lg font-bold">Instalar GBD Market</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega el acceso directo a la pantalla de inicio de tu teléfono:
            </p>
            {esIOS ? (
              <ol className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Share className="h-4 w-4 text-primary" /> Toca el botón <b>Compartir</b> en Safari.
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Elige <b>Agregar a pantalla de inicio</b>.
                </li>
                <li>Confirma con <b>Agregar</b>.</li>
              </ol>
            ) : (
              <ol className="mt-3 space-y-2 text-sm">
                <li>Abre el menú <b>⋮</b> de tu navegador.</li>
                <li>Elige <b>Instalar aplicación</b> o <b>Agregar a pantalla de inicio</b>.</li>
                <li>Confirma la instalación.</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
