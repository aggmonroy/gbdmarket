import { createFileRoute } from "@tanstack/react-router";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { NewsletterPosts } from "@/components/site/NewsletterPosts";

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
        <div className="mt-6">
          <NewsletterPosts />
        </div>
      </section>
    </div>
  );
}
