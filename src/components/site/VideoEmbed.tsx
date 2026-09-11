/** Reproductor incrustado para videos de YouTube o publicaciones de Instagram. */
export function resolverEmbed(url: string): { src: string; tipo: "youtube" | "instagram" } | null {
  const raw = url?.trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? { src: `https://www.youtube.com/embed/${id}`, tipo: "youtube" } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? { src: `https://www.youtube.com/embed/${id}`, tipo: "youtube" } : null;
    }
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
    if (m) return { src: `https://www.youtube.com/embed/${m[2]}`, tipo: "youtube" };
    return null;
  }
  if (host === "instagram.com" || host === "instagr.am") {
    const m = u.pathname.match(/^\/(p|reel|reels|tv)\/([\w-]+)/);
    if (!m) return null;
    const tipoPath = m[1] === "reels" ? "reel" : m[1];
    return { src: `https://www.instagram.com/${tipoPath}/${m[2]}/embed`, tipo: "instagram" };
  }
  return null;
}

export function VideoEmbed({ url, titulo }: { url: string; titulo?: string }) {
  const embed = resolverEmbed(url);
  if (!embed) return null;

  if (embed.tipo === "instagram") {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border bg-muted">
        <iframe
          src={embed.src}
          title={titulo ?? "Publicación de Instagram"}
          loading="lazy"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-[560px] w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
      <iframe
        src={embed.src}
        title={titulo ?? "Video de YouTube"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
