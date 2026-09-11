import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Megaphone, Share2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoEmbed, resolverEmbed } from "@/components/site/VideoEmbed";
import { compartirNewsletter } from "@/lib/compartir";
import { obtenerNewsletterPublicado } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/novedades/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Publicación del boletín · Mueblería GBD" },
      { name: "description", content: "Consulta y comparte esta publicación del boletín de Mueblería GBD." },
      { property: "og:title", content: "Publicación del boletín · Mueblería GBD" },
      { property: "og:description", content: "Promoción o anuncio de Mueblería GBD para compartir." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/novedades/${params.id}` }],
  }),
  component: NewsletterIndividual,
});

function NewsletterIndividual() {
  const { id } = Route.useParams();
  const getPost = useServerFn(obtenerNewsletterPublicado);
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["newsletter-publicacion", id],
    queryFn: () => getPost({ data: { id } }),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Cargando publicación…</div>;
  }

  if (error || !post) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Publicación no disponible</h1>
        <p className="mt-2 text-muted-foreground">El enlace no existe o la publicación ya no está visible.</p>
        <Button asChild className="mt-6">
          <Link to="/novedades">Ver todas las novedades</Link>
        </Button>
      </div>
    );
  }

  const video = resolverEmbed(post.video_url ?? "");
  const hasVisual = Boolean(video || post.image_url);

  return (
    <main className="container mx-auto px-4 py-8 lg:px-8 lg:py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/novedades"><ArrowLeft /> Novedades</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => compartirNewsletter({ id: post.id, titulo: post.titulo, resumen: post.resumen })}
        >
          <Share2 /> Compartir publicación
        </Button>
      </div>

      <article
        className={`grid overflow-hidden rounded-xl border border-border bg-card md:min-h-[420px] ${
          hasVisual ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-1"
        }`}
      >
        <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={post.tipo === "promocion" ? "default" : "secondary"} className="gap-1">
              {post.tipo === "promocion" ? <Tag /> : <Megaphone />}
              {post.tipo === "promocion" ? "Promoción" : "Anuncio"}
            </Badge>
            {post.published_at && (
              <time dateTime={post.published_at} className="text-xs text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString("es-PA", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            )}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">{post.titulo}</h1>
          {post.resumen && <p className="mt-4 font-medium text-muted-foreground">{post.resumen}</p>}
          {post.cuerpo && <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/90">{post.cuerpo}</p>}
          {post.cta_url && (
            <Button asChild className="mt-6 w-fit">
              <a href={post.cta_url} target="_blank" rel="noreferrer">{post.cta_label || "Ver más"}</a>
            </Button>
          )}
        </div>

        {hasVisual && (
          <div className="flex min-h-[260px] min-w-0 items-center justify-center border-t border-border bg-muted/40 p-3 sm:p-5 md:min-h-full md:border-l md:border-t-0">
            {video && post.video_url ? (
              <div className="w-full"><VideoEmbed url={post.video_url} titulo={post.titulo} /></div>
            ) : (
              <img src={post.image_url ?? ""} alt={post.titulo} className="h-auto max-h-[720px] w-full object-contain" />
            )}
          </div>
        )}
      </article>
    </main>
  );
}