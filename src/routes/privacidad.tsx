import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Mail } from "lucide-react";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad · Cooperativa Gladys B. de Ducasa R.L." },
      { name: "description", content: "Cómo tratamos, protegemos y conservamos los datos personales que recibimos a través de nuestros formularios y canales de atención." },
      { property: "og:title", content: "Política de Privacidad · GBD" },
      { property: "og:description", content: "Uso responsable de la información de nuestros clientes y asociados." },
    ],
    links: [{ rel: "canonical", href: "/privacidad" }],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-14 max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Política de Privacidad</h1>
          <p className="mt-2 text-muted-foreground">Cooperativa Gladys B. de Ducasa R.L. — Última actualización: {new Date().getFullYear()}.</p>
        </div>
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground">1. Datos que recopilamos</h2>
          <p className="mt-2">
            Recopilamos únicamente la información que usted proporciona voluntariamente al completar formularios de contacto,
            cotización, financiamiento, garantías, servicios de bordados o al comunicarse por WhatsApp: nombre, teléfono,
            correo electrónico, cédula (cuando aplica) y detalles del producto o servicio de su interés.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">2. Finalidad del tratamiento</h2>
          <p className="mt-2">Sus datos se utilizan exclusivamente para:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Elaborar y dar seguimiento a cotizaciones.</li>
            <li>Procesar ventas y financiamientos cooperativos.</li>
            <li>Gestionar garantías y servicio post-venta.</li>
            <li>Brindar atención al cliente y coordinar entregas.</li>
          </ul>
          <p className="mt-2">
            No utilizamos sus datos para envíos publicitarios masivos ni los cedemos a terceros para fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">3. Confidencialidad</h2>
          <p className="mt-2">
            Sus datos no serán compartidos con terceros, salvo obligación legal expresa o solicitud de una autoridad
            competente en el marco de un procedimiento oficial. Aplicamos medidas técnicas y organizativas razonables para
            protegerlos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">4. Sus derechos</h2>
          <p className="mt-2">
            Usted puede en cualquier momento solicitar el acceso, la actualización o la eliminación de sus datos, escribiendo
            a{" "}
            <a href="mailto:lineablanca@coopgbd.com" className="text-primary font-medium hover:underline">
              lineablanca@coopgbd.com
            </a>
            . Atenderemos la solicitud en un plazo razonable.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">5. Consentimiento</h2>
          <p className="mt-2">
            Al aceptar el tratamiento de datos en nuestros formularios, usted autoriza expresamente a la Cooperativa Gladys
            B. de Ducasa R.L. a procesar la información con los fines aquí descritos. Registramos la fecha y hora de la
            aceptación como evidencia del consentimiento otorgado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">6. Contacto</h2>
          <p className="mt-2 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <a href="mailto:lineablanca@coopgbd.com" className="text-primary font-medium hover:underline">
              lineablanca@coopgbd.com
            </a>
          </p>
        </section>

        <div className="pt-6">
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
