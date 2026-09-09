import { Instagram } from "lucide-react";

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
  {
    usuario: "@coopgladysducasa",
    nombre: "Coop. Gladys B. de Ducasa R.L.",
    perfil: "https://www.instagram.com/coopgladysducasa/",
    embed: "https://www.instagram.com/coopgladysducasa/embed",
  },
];

export function InstagramDuo() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Instagram className="h-4 w-4" /> Síguenos en Instagram
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-3">
          {CUENTAS.map((c, idx) => (
            <div
              key={c.usuario}
              className="overflow-hidden rounded-lg sm:rounded-xl border border-border bg-card animate-fade-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <iframe
                src={c.embed}
                title={`Publicaciones de Instagram ${c.usuario}`}
                className="h-[300px] sm:h-[420px] w-full border-0"
                loading="lazy"
                allowTransparency
                scrolling="no"
              />
              <div className="border-t border-border px-2 py-1.5 text-center">
                <a
                  href={c.perfil}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold hover:underline"
                >
                  <Instagram className="h-3 w-3" /> <span className="truncate">{c.usuario}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
