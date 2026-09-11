import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Tag } from "lucide-react";
import { listarNewsletterPublicado } from "@/lib/newsletter.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoEmbed, resolverEmbed } from "@/components/site/VideoEmbed";

type NewsletterPost = {
  id: string;
  titulo: string;
  resumen: string | null;
  cuerpo: string | null;
  tipo: "promocion" | "anuncio";
  image_url: string | null;
  video_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  published_at: string | null;
};

export function NewsletterPosts() {
  const listFn = useServerFn(listarNewsletterPublicado);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["newsletter-publicado"],
    queryFn: () => listFn(),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando novedades…</p>;
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">Muy pronto publicaremos nuestras novedades.</p>;
  }

  return (
    <div className="space-y-6">
      {(posts as NewsletterPost[]).map((p) => {
        const video = resolverEmbed(p.video_url ?? "");
        const hasVisual = Boolean(video || p.image_url);

        return (
          <article
            key={p.id}
            className={`grid overflow-hidden rounded-xl border border-border bg-card md:min-h-[360px] ${
              hasVisual ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-1"
            }`}
          >
            <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7 lg:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={p.tipo === "promocion" ? "default" : "secondary"} className="gap-1">
                  {p.tipo === "promocion" ? <Tag className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
                  {p.tipo === "promocion" ? "Promoción" : "Anuncio"}
                </Badge>
                {p.published_at && (
                  <time dateTime={p.published_at} className="text-xs text-muted-foreground">
                    {new Date(p.published_at).toLocaleDateString("es-PA", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                )}
              </div>
              <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">{p.titulo}</h3>
              {p.resumen && <p className="mt-3 text-sm font-medium text-muted-foreground sm:text-base">{p.resumen}</p>}
              {p.cuerpo && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{p.cuerpo}</p>
              )}
              {p.cta_url && (
                <Button asChild size="sm" className="mt-5 w-fit">
                  <a href={p.cta_url} target="_blank" rel="noreferrer">
                    {p.cta_label || "Ver más"}
                  </a>
                </Button>
              )}
            </div>

            {hasVisual && (
              <div className="flex min-h-[240px] min-w-0 items-center justify-center border-t border-border bg-muted/40 p-2 md:min-h-full md:border-l md:border-t-0 sm:p-4">
                {video && p.video_url ? (
                  <div className="w-full">
                    <VideoEmbed url={p.video_url} titulo={p.titulo} />
                  </div>
                ) : (
                  <img
                    src={p.image_url ?? ""}
                    alt={p.titulo}
                    loading="lazy"
                    className="max-h-[620px] h-auto w-full object-contain"
                  />
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
