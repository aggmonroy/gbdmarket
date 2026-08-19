import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { NewsletterPosts } from "@/components/site/NewsletterPosts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/novedades")({
  head: () => ({
    meta: [
      { title: "Novedades y boletín · Mueblería GBD" },
      {
        name: "description",
        content:
          "Suscríbete al boletín de Mueblería GBD y recibe promociones, anuncios y lanzamientos de Línea Blanca y Bordados.",
      },
      { property: "og:title", content: "Novedades y boletín · Mueblería GBD" },
      {
        property: "og:description",
        content: "Promociones, anuncios y lanzamientos de Línea Blanca y Bordados de la Cooperativa GBD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/novedades" }],
  }),
  component: Novedades,
  errorComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      No pudimos cargar las novedades. Intenta de nuevo.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Página no encontrada.</div>
  ),
});

function Novedades() {
  const listFn = useServerFn(listarNewsletterPublicado);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["newsletter-publicado"],
    queryFn: () => listFn(),
  });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <header className="max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Boletín GBD</span>
        <h1 className="mt-1 font-display text-3xl lg:text-4xl font-bold">Novedades, promociones y anuncios</h1>
        <p className="mt-3 text-muted-foreground">
          Suscríbete y recibe primero nuestras ofertas de Línea Blanca, muebles y bordados.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <NewsletterSignup />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Últimas publicaciones</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Muy pronto publicaremos nuestras novedades.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: any) => (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.titulo}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <Badge variant={p.tipo === "promocion" ? "default" : "secondary"} className="gap-1">
                    {p.tipo === "promocion" ? <Tag className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
                    {p.tipo === "promocion" ? "Promoción" : "Anuncio"}
                  </Badge>
                  <h3 className="mt-2 font-display text-lg font-bold">{p.titulo}</h3>
                  {p.published_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.published_at).toLocaleDateString("es-PA", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {p.resumen && <p className="mt-2 text-sm text-muted-foreground">{p.resumen}</p>}
                  {p.cuerpo && (
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground/90">{p.cuerpo}</p>
                  )}
                  {p.cta_url && (
                    <Button asChild size="sm" className="mt-4">
                      <a href={p.cta_url} target="_blank" rel="noreferrer">
                        {p.cta_label || "Ver más"}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
