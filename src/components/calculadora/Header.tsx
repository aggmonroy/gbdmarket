import { MessageCircle } from "lucide-react";
import logoIcono from "@/assets/calculadora/logo-icono.png";
import logoBanner from "@/assets/calculadora/logo-banner.png";

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-[#002362] text-[#F4F9FF] sticky top-0 z-20 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <img src={logoIcono} alt="GBD" className="h-12 w-12 rounded-lg bg-white/95 p-1 shadow-sm shrink-0" />
          <img
            src={logoBanner}
            alt="Cooperativa Gladys B. de Ducasa R.L. — Sección Línea Blanca"
            className="h-9 sm:h-10 object-contain object-left"
          />
        </div>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Calculadora de Precios</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-[#1F6DD8] px-2 py-0.5 rounded-full">
              <MessageCircle size={12} /> +507 6784-1941
            </span>
          </div>
          {children}
        </div>
        <span className="sm:hidden mt-2 inline-flex items-center gap-1 text-[11px] font-bold bg-[#1F6DD8] px-2 py-0.5 rounded-full">
          <MessageCircle size={12} /> +507 6784-1941
        </span>
      </div>
    </div>
  );
}
