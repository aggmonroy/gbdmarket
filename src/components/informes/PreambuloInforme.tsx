/**
 * Preámbulo formal del informe mensual: membrete de la cooperativa, mes reportado,
 * destinatario y texto introductorio con el período fiscal (agosto–julio).
 */
import { useSiteSettings } from "@/hooks/use-site-settings";
import { infoPeriodo } from "@/lib/informes-shared";

export function PreambuloInforme({
  periodo,
  estado,
  generadoEn,
}: {
  periodo: string;
  estado?: "borrador" | "generado";
  generadoEn?: string | null;
}) {
  const { branding } = useSiteSettings();
  const logoUrl = branding?.logo_url || "";
  const { mesNombre, anio, periodoFiscal, inicioFiscal } = infoPeriodo(periodo);
  const mes = mesNombre.charAt(0) + mesNombre.slice(1).toLowerCase();
  const fechaReporte = new Date().toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-border bg-card text-sm leading-relaxed text-foreground shadow-soft print:rounded-none print:border-0 print:shadow-none">
      {/* Membrete institucional */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-gradient-primary px-5 py-4 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Cooperativa GBD"
              className="h-14 w-14 shrink-0 rounded-lg bg-background/95 object-contain p-1"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-display text-sm font-bold uppercase leading-tight sm:text-base">
              Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L.
            </p>
            <p className="text-xs opacity-85">Sección de Línea Blanca y Bordados</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] opacity-90 sm:text-[11px]">
              Informe mensual · Línea Blanca y Bordados GBD
            </p>
          </div>
        </div>
        <p className="shrink-0 text-right font-display text-lg font-bold leading-tight sm:text-2xl">
          {mesNombre}
          <br className="sm:hidden" /> <span className="whitespace-nowrap">{anio}</span>
        </p>
      </header>

      <div className="px-5 pb-5 pt-3 print:px-0">
      <h2 className="text-center font-display text-base font-bold uppercase tracking-wide sm:text-lg">
        Reporte de cierre mensual de Línea Blanca
      </h2>
      <p className="mt-0.5 text-center text-xs text-muted-foreground">{fechaReporte}</p>

      <div className="mt-3 space-y-0.5">
        <p className="font-semibold uppercase">Dirigido a:</p>
        <p>Magíster Elena Moreno C.</p>
        <p>Gerente General Coop. GBD</p>
        <p>E. S. M.</p>
      </div>

      <div className="mt-3 space-y-2 text-justify text-[13px]">
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
