import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Tag } from "lucide-react";
import { listarNewsletterPublicado } from "@/lib/newsletter.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
