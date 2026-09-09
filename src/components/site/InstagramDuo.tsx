import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";
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
];

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

        <div className="mt-3 grid gap-3 md:grid-cols-3">
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
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2">
        <a
          href={cuenta.perfil}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-2 text-xs font-semibold hover:text-primary"
        >
          <Instagram className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{cuenta.usuario}</span>
        </a>
        {count > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={previous} aria-label={`Publicación anterior de ${cuenta.usuario}`}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-[10px] text-muted-foreground">{current + 1}/{count}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next} aria-label={`Publicación siguiente de ${cuenta.usuario}`}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      <div className="relative h-[470px] w-full bg-muted/20 sm:h-[520px] md:h-[470px]">
        {shortcode ? (
          <iframe
            key={shortcode}
            src={`https://www.instagram.com/p/${shortcode}/embed/captioned`}
            title={`Publicación de Instagram ${cuenta.usuario}`}
            className="h-full w-full border-0"
            loading="lazy"
            allowTransparency
            scrolling="no"
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
            Cargando publicación…
          </div>
        )}
      </div>
    </article>
  );
}
