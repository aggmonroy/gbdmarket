import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin, Globe, Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useSocioActivo } from "@/lib/socio";

function SocialIcon({ url }: { url: string }) {
  const u = url.toLowerCase();
  if (u.includes("instagram")) return <Instagram className="h-4 w-4" />;
  if (u.includes("facebook") || u.includes("fb.com")) return <Facebook className="h-4 w-4" />;
  if (u.includes("youtube") || u.includes("youtu.be")) return <Youtube className="h-4 w-4" />;
  if (u.includes("tiktok")) return <Music2 className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

export function SiteFooter() {
  const { branding, contact } = useSiteSettings();
  const socio = useSocioActivo();
  const siteName = branding?.site_name || "Cooperativa Gladys B. de Ducasa R.L.";
  const email = contact?.email || "lineablanca@coopgbd.com";
  const waLB = contact?.whatsapp_lineablanca || "50767841941";
  const waBord = contact?.whatsapp_bordados || "50768298538";
  const branches = contact?.branches ?? [];
  const socials = contact?.socials ?? [
    { label: "@gbdmuebleria", url: "https://www.instagram.com/gbdmuebleria/" },
    { label: "coopgbd.com", url: "https://coopgbd.com/" },
  ];

  if (socio) {
    return (
      <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 py-10 grid gap-8 md:grid-cols-2">
          <div>
            <div className="font-display text-lg font-bold">{socio.nombre}</div>
            <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">{socio.descripcion}</p>
            <a
              href={`https://wa.me/${socio.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> +{socio.whatsapp}
            </a>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Navegación</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/catalogo" className="hover:underline">Catálogo</Link></li>
              <li><Link to="/novedades" className="hover:underline">Novedades</Link></li>
              <li><Link to="/privacidad" className="hover:underline">Política de privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/15">
          <div className="container mx-auto px-4 py-4 text-xs text-primary-foreground/70">
            © {new Date().getFullYear()} {socio.nombre}. Catálogo en alianza con {siteName}.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">{siteName}</div>
          <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">
            64 años sirviendo a nuestros asociados con financiamiento, garantía y atención cercana en Línea Blanca y Bordados.
          </p>
          <div className="mt-4 flex gap-2">
            {socials.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition">
                <SocialIcon url={s.url} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Catálogo</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/catalogo" className="hover:underline">Catálogo</Link></li>
            <li><Link to="/financiamiento" className="hover:underline">Financiamiento</Link></li>
            <li><Link to="/garantias" className="hover:underline">Garantías</Link></li>
            <li><Link to="/novedades" className="hover:underline">Novedades</Link></li>
            <li><Link to="/contacto" className="hover:underline">Contacto</Link></li>
            <li><Link to="/privacidad" className="hover:underline">Política de privacidad</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Contacto</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a href={`https://wa.me/${waLB}`} className="hover:underline">+{waLB} · Línea Blanca</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a href={`https://wa.me/${waBord}`} className="hover:underline">+{waBord} · Bordados</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${email}`} className="hover:underline">{email}</a>
            </li>
            {branches.slice(0, 2).map((b, i) => (
              <li key={i} className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> {b.name}{b.address ? ` · ${b.address}` : ""}</li>
            ))}
            {branches.length === 0 && (
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Las Tablas, Los Santos, Panamá</li>
            )}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Síguenos</div>
          <ul className="mt-3 space-y-2 text-sm">
            {socials.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <SocialIcon url={s.url} />
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container mx-auto px-4 py-4 text-xs text-primary-foreground/70 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} {siteName}. Todos los derechos reservados.</span>
          <span className="flex items-center gap-3">
            <Link to="/privacidad" className="hover:underline">Privacidad</Link>
            <span>RUC autorizado · Panamá</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
