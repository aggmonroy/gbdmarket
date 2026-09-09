import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, ExternalLink, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInstagramPosts } from "@/lib/instagram.functions";

const CUENTAS = [
  {
    usuario: "@gbdmuebleria",
    nombre: "Mueblería GBD",
    perfil: "https://www.instagram.com/gbdmuebleria/",
    key: "gbdmuebleria",
  },
  {
    usuario: "@bordadosgbd",
    nombre: "Bordados GBD",
    perfil: "https://www.instagram.com/bordadosgbd/",
    key: "bordadosgbd",
  },
  {
    usuario: "@coopgladysducasa",
    nombre: "Coop. Gladys B. de Ducasa R.L.",
    perfil: "https://www.instagram.com/coopgladysducasa/",
    key: "coopgladysducasa",
  },
] as const;

export function InstagramDuo() {
  const fetchPosts = useServerFn(getInstagramPosts);
  const { data } = useQuery({
    queryKey: ["instagram-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 30 * 60 * 1000,
  });

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Instagram className="h-4 w-4" /> Síguenos en Instagram
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-3">
          {CUENTAS.map((c, idx) => (
            <InstagramGallery
              key={c.usuario}
              cuenta={c}
              posts={data?.[c.key] ?? []}
              delay={idx * 1800}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramGallery({
  cuenta,
  posts,
  delay,
}: {
  cuenta: (typeof CUENTAS)[number];
  posts: string[];
  delay: number;
}) {
  const [current, setCurrent] = useState(0);
  const count = posts.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setTimeout(() => {
      setCurrent((value) => (value + 1) % count);
    }, 7000 + delay);
    return () => window.clearTimeout(timer);
  }, [count, current, delay]);

  const previous = () => setCurrent((value) => (value - 1 + count) % count);
  const next = () => setCurrent((value) => (value + 1) % count);
  const shortcode = posts[current];

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card animate-fade-up">
      <header className="flex min-w-0 items-center justify-between gap-1 border-b border-border px-1.5 py-1.5 sm:px-3 sm:py-2">
        <a
          href={cuenta.perfil}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1 text-[9px] font-semibold hover:text-primary sm:gap-2 sm:text-xs"
        >
          <Instagram className="h-3 w-3 shrink-0 text-primary sm:h-4 sm:w-4" />
          <span className="truncate">{cuenta.usuario}</span>
        </a>
        <Button asChild variant="ghost" size="icon" className="h-6 w-6 shrink-0 sm:h-7 sm:w-7">
          <a href={cuenta.perfil} target="_blank" rel="noreferrer" aria-label={`Ver perfil de ${cuenta.usuario}`} title="Ver perfil">
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          </a>
        </Button>
      </header>

      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        {shortcode ? (
          <iframe
            key={shortcode}
            src={`https://www.instagram.com/p/${shortcode}/embed/captioned`}
            title={`Publicación de Instagram ${cuenta.usuario}`}
            className="absolute left-0 top-[-54px] h-[620px] w-full border-0 sm:top-[-58px]"
            loading="lazy"
            allowTransparency
            scrolling="no"
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
            Cargando publicación…
          </div>
        )}
        {count > 1 && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-0.5 sm:px-1">
            <Button variant="secondary" size="icon" className="pointer-events-auto h-6 w-6 bg-background/90 shadow-sm sm:h-7 sm:w-7" onClick={previous} aria-label={`Publicación anterior de ${cuenta.usuario}`}>
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="pointer-events-auto h-6 w-6 bg-background/90 shadow-sm sm:h-7 sm:w-7" onClick={next} aria-label={`Publicación siguiente de ${cuenta.usuario}`}>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
      <Button asChild variant="ghost" className="h-7 w-full rounded-none border-t border-border px-1 text-[9px] sm:h-8 sm:text-xs">
        <a href={cuenta.perfil} target="_blank" rel="noreferrer">Ver perfil</a>
      </Button>
    </article>
  );
}
