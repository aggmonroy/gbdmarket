/**
 * Preámbulo formal del informe mensual: membrete de la cooperativa, destinatario
 * y texto introductorio con el mes reportado y el período fiscal (agosto–julio).
 */
import { useSiteSettings } from "@/hooks/use-site-settings";
import { infoPeriodo } from "@/lib/informes-shared";

export function PreambuloInforme({ periodo }: { periodo: string }) {
  const { branding } = useSiteSettings();
  const logoUrl = branding?.logo_url || "";
  const { mesNombre, inicioFiscal } = infoPeriodo(periodo);
  const mes = mesNombre.charAt(0) + mesNombre.slice(1).toLowerCase();
  const fechaReporte = new Date().toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground print:rounded-none print:border-0 print:p-0">
      {/* Membrete */}
      <header className="flex items-center gap-3 border-b border-border pb-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Cooperativa GBD" className="h-14 w-14 rounded-lg object-contain" />
        ) : null}
        <div className="min-w-0">
          <p className="font-display text-base font-bold uppercase leading-tight">
            Cooperativa de Servicios Múltiples Gladys B. de Ducasa, R.L.
          </p>
          <p className="text-xs text-muted-foreground">
            Departamento de Línea Blanca, Mueblería y Bordados
          </p>
        </div>
      </header>

      <h2 className="mt-4 text-center font-display text-lg font-bold uppercase tracking-wide">
        Reporte de cierre mensual de Línea Blanca
      </h2>
      <p className="mt-1 text-center text-xs text-muted-foreground">{fechaReporte}</p>

      <div className="mt-4 space-y-0.5">
        <p className="font-semibold uppercase">Dirigido a:</p>
        <p>Magíster Elena Moreno C.</p>
        <p>Gerente General Coop. GBD</p>
        <p>E. S. M.</p>
      </div>

      <div className="mt-4 space-y-3 text-justify">
        <p>
          El presente reporte tiene como objetivo proporcionar a la Gerencia General un resumen de los
          principales resultados y aspectos relevantes de la gestión de Línea Blanca correspondientes al mes de{" "}
          {mes}, dentro del período fiscal comprendido entre agosto de {inicioFiscal} y julio de{" "}
          {inicioFiscal + 1}.
        </p>
        <p>
          El informe contempla información relacionada con las ventas, cuentas por cobrar, morosidad,
          inventario, actividades comerciales y de mercadeo, así como los principales acontecimientos,
          gestiones y acciones implementadas durante el período.
        </p>
        <p>
          Asimismo, cuando corresponda, se incorporan los resultados y aspectos relevantes de las operaciones
          de Bordados y Sublimación, incluyendo información sobre ventas, inventario y acciones orientadas a
          mejorar la organización y eficiencia de los procesos.
        </p>
        <p>
          La información presentada busca facilitar el seguimiento de los resultados, identificar situaciones
          que requieran atención y brindar a la Gerencia una visión general del desempeño de las áreas durante
          el mes reportado.
        </p>
      </div>
    </section>
  );
}
