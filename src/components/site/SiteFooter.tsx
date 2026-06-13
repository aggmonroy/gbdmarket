import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin, Instagram, Globe } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">Cooperativa Gladys B. de Ducasa R.L.</div>
          <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">
            64 años sirviendo a nuestros asociados con financiamiento, garantía y atención cercana en Línea Blanca y Bordados.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Catálogo</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/linea-blanca" className="hover:underline">Línea Blanca</Link></li>
            <li><Link to="/bordados" className="hover:underline">Bordados</Link></li>
            <li><Link to="/financiamiento" className="hover:underline">Financiamiento</Link></li>
            <li><Link to="/contacto" className="hover:underline">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Contacto</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a href="https://wa.me/50767841941" className="hover:underline">+507 6784-1941 · Línea Blanca</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a href="https://wa.me/50768298538" className="hover:underline">+507 6829-8538 · Bordados</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:lineablanca@coopgbd.com" className="hover:underline">lineablanca@coopgbd.com</a>
            </li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Las Tablas, Los Santos, Panamá</li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Síguenos</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4" /><a href="https://www.instagram.com/gbdmuebleria/" target="_blank" rel="noreferrer" className="hover:underline">@gbdmuebleria</a></li>
            <li className="flex items-center gap-2"><Globe className="h-4 w-4" /><a href="https://coopgbd.com/" target="_blank" rel="noreferrer" className="hover:underline">coopgbd.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container mx-auto px-4 py-4 text-xs text-primary-foreground/70 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Cooperativa Gladys B. de Ducasa R.L. Todos los derechos reservados.</span>
          <span>RUC autorizado · Panamá</span>
        </div>
      </div>
    </footer>
  );
}
