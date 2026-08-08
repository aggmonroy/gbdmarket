import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { defaultGreeting, type WaChannel } from "@/lib/whatsapp";
import { WhatsAppLeadDialog } from "./WhatsAppLeadDialog";

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const [canal, setCanal] = useState<WaChannel | null>(null);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-xl bg-card text-card-foreground shadow-elevated border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div className="font-display font-semibold">¿En qué te ayudamos?</div>
            <div className="text-xs opacity-90">Respuesta inmediata por WhatsApp</div>
          </div>
          <div className="p-2">
            <button
              onClick={() => { setCanal("linea-blanca"); setOpen(false); }}
              className="w-full text-left rounded-lg px-3 py-3 hover:bg-accent transition flex items-center gap-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">LB</span>
              <span>
                <span className="block font-medium text-sm">Línea Blanca</span>
                <span className="block text-xs text-muted-foreground">+507 6784-1941</span>
              </span>
            </button>
            <button
              onClick={() => { setCanal("bordados"); setOpen(false); }}
              className="w-full text-left rounded-lg px-3 py-3 hover:bg-accent transition flex items-center gap-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">B</span>
              <span>
                <span className="block font-medium text-sm">Bordados</span>
                <span className="block text-xs text-muted-foreground">+507 6829-8538</span>
              </span>
            </button>
          </div>
        </div>
      )}

      <button
        aria-label="WhatsApp"
        onClick={() => setOpen(!open)}
        className="grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-glow hover:scale-105 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>

      {canal && (
        <WhatsAppLeadDialog
          open
          onOpenChange={(b) => !b && setCanal(null)}
          channel={canal}
          mensaje={defaultGreeting(canal)}
        />
      )}
    </div>
  );
}
