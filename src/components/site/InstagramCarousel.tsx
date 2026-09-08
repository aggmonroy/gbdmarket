import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";

const CUENTAS = [
  {
    usuario: "@gbdmuebleria",
    nombre: "Mueblería GBD",
    perfil: "https://www.instagram.com/gbdmuebleria/",
    embed: "https://www.instagram.com/gbdmuebleria/embed",
  },
  {
    usuario: "@bordadosgbd",
    nombre: "Bordados GBD",
    perfil: "https://www.instagram.com/bordadosgbd/",
    embed: "https://www.instagram.com/bordadosgbd/embed",
  },
];

export function InstagramCarousel() {
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setI((v) => (v + 1) % CUENTAS.length), 8000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, []);

  const prev = () => setI((v) => (v - 1 + CUENTAS.length) % CUENTAS.length);
  const next = () => setI((v) => (v + 1) % CUENTAS.length);
  const cuenta = CUENTAS[i];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider opacity-90">
        <Instagram className="h-4 w-4" /> Síguenos en Instagram
      </div>

      <div className="relative mt-3 overflow-hidden rounded-xl bg-primary-foreground/10">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
          {CUENTAS.map((c, idx) => (
            <div key={c.usuario} className="w-full shrink-0">
              {idx === i && (
                <iframe
                  src={c.embed}
                  title={`Publicaciones de Instagram ${c.usuario}`}
                  className="h-[420px] w-full border-0"
                  loading="lazy"
                  allowTransparency
                  scrolling="no"
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={prev}
          aria-label="Cuenta anterior"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 text-white backdrop-blur hover:bg-slate-900/80 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          aria-label="Cuenta siguiente"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 text-white backdrop-blur hover:bg-slate-900/80 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <a
          href={cuenta.perfil}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
        >
          <Instagram className="h-3.5 w-3.5" /> {cuenta.usuario}
        </a>
        <div className="flex gap-1.5">
          {CUENTAS.map((c, idx) => (
            <button
              key={c.usuario}
              onClick={() => setI(idx)}
              aria-label={`Ver ${c.nombre}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-amber-300" : "w-1.5 bg-primary-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
