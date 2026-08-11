CREATE TABLE public.informes_mensuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'borrador',
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  narrativa jsonb NOT NULL DEFAULT '{}'::jsonb,
  gestion jsonb NOT NULL DEFAULT '{}'::jsonb,
  generado_en timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.informe_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serie text NOT NULL,
  periodo text NOT NULL,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (serie, periodo)
);

CREATE TABLE public.informe_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL,
  reporte text NOT NULL,
  filename text,
  resumen jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.informes_mensuales TO service_role;
GRANT ALL ON public.informe_series TO service_role;
GRANT ALL ON public.informe_archivos TO service_role;

ALTER TABLE public.informes_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_archivos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER informes_mensuales_updated_at BEFORE UPDATE ON public.informes_mensuales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER informe_series_updated_at BEFORE UPDATE ON public.informe_series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX informe_series_serie_idx ON public.informe_series (serie, periodo);
CREATE INDEX informe_archivos_periodo_idx ON public.informe_archivos (periodo);