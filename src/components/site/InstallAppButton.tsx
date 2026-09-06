import { useEffect, useState } from "react";
import { Download, Share, Plus, X, Copy, ExternalLink } from "lucide-react";
import { trackInteraction } from "@/hooks/use-analytics";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function plataforma(): string {
  if (typeof navigator === "undefined") return "desconocida";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  return "Escritorio";
}

/** Detecta navegadores donde el instalador automático no aparece (Honor/Huawei, Samsung, apps sociales). */
function tipoNavegador(): "ios" | "huawei" | "samsung" | "inapp" | "otro" {
  if (typeof navigator === "undefined") return "otro";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/FBAN|FBAV|Instagram|Line\/|Twitter|TikTok|WhatsApp/i.test(ua)) return "inapp";
  if (/HuaweiBrowser|Huawei|HONOR|HarmonyOS|HMSCore|petal/i.test(ua)) return "huawei";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  return "otro";
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
      registrarInstalacion("deteccion");
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

  const tipo = tipoNavegador();

  const pasos: Record<string, { titulo: string; items: React.ReactNode[] }> = {
    ios: {
      titulo: "En iPhone (Safari)",
      items: [
        <span key="1" className="flex items-center gap-2">
          <Share className="h-4 w-4 text-primary" /> Toca el botón <b>Compartir</b>.
        </span>,
        <span key="2" className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Elige <b>Agregar a pantalla de inicio</b>.
        </span>,
        <span key="3">Confirma con <b>Agregar</b>.</span>,
      ],
    },
    huawei: {
      titulo: "En Honor o Huawei",
      items: [
        <span key="1">Toca el menú <b>⋮</b> (o las tres rayas) abajo a la derecha.</span>,
        <span key="2">Elige <b>Agregar a pantalla de inicio</b> o <b>Añadir acceso directo</b>.</span>,
        <span key="3">
          Si no aparece esa opción, copia el enlace y ábrelo en <b>Chrome</b>: allí verás
          <b> Instalar aplicación</b>.
        </span>,
      ],
    },
    samsung: {
      titulo: "En Samsung Internet",
      items: [
        <span key="1">Toca el menú <b>☰</b> abajo a la derecha.</span>,
        <span key="2">Elige <b>Agregar página a</b> → <b>Pantalla de inicio</b>.</span>,
      ],
    },
    inapp: {
      titulo: "Abre primero en tu navegador",
      items: [
        <span key="1">Estás dentro de otra aplicación (WhatsApp, Instagram, Facebook).</span>,
        <span key="2">Toca <b>⋮</b> y elige <b>Abrir en el navegador</b>, o copia el enlace aquí abajo.</span>,
        <span key="3">Ya en Chrome, vuelve a tocar <b>Descargar app</b>.</span>,
      ],
    },
    otro: {
      titulo: "En tu teléfono Android",
      items: [
        <span key="1">Abre el menú <b>⋮</b> de tu navegador.</span>,
        <span key="2">Elige <b>Instalar aplicación</b> o <b>Agregar a pantalla de inicio</b>.</span>,
        <span key="3">Confirma la instalación.</span>,
      ],
    },
  };

  const guia = pasos[tipo] ?? pasos.otro;
  const enlace = typeof window !== "undefined" ? window.location.origin : "";

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
            <p className="mt-1 text-sm text-muted-foreground">{guia.titulo}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm">
              {guia.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(enlace);
                  void trackInteraction("cta_click", { meta: { accion: "copiar_enlace_instalacion" } });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar enlace
              </button>
              {tipo !== "ios" && (
                <a
                  href={`intent://${enlace.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en Chrome
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>

          </div>
        </div>
      )}
    </>
  );
}
