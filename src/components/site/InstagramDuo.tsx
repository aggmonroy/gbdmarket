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
];

export function InstagramDuo() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
            <Instagram className="h-4 w-4" /> Síguenos en Instagram
          </div>
          <div className="hidden sm:flex gap-4 text-xs font-semibold">
            {CUENTAS.map((c) => (
              <a key={c.usuario} href={c.perfil} target="_blank" rel="noreferrer" className="hover:underline text-muted-foreground">
                {c.usuario}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-2">
          {CUENTAS.map((c, idx) => (
            <div
              key={c.usuario}
              className="overflow-hidden rounded-xl border border-border bg-card animate-fade-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <iframe
                src={c.embed}
                title={`Publicaciones de Instagram ${c.usuario}`}
                className="h-[420px] w-full border-0"
                loading="lazy"
                allowTransparency
                scrolling="no"
              />
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <a
                  href={c.perfil}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                >
                  <Instagram className="h-3.5 w-3.5" /> {c.usuario}
                </a>
                <span className="text-[11px] text-muted-foreground">{c.nombre}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
