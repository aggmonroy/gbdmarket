ALTER TABLE public.informes_mensuales
  ADD COLUMN IF NOT EXISTS visible_gerente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aprobado_en timestamptz,
  ADD COLUMN IF NOT EXISTS aprobado_por uuid;

CREATE TABLE IF NOT EXISTS public.informe_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL,
  clave text NOT NULL,
  tipo text NOT NULL,
  cliente text,
  detalle text,
  monto numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'abierta',
  primer_periodo text NOT NULL,
  meses_arrastre integer NOT NULL DEFAULT 0,
  nota text,
  resuelto_en timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (periodo, clave)
);

GRANT ALL ON public.informe_alertas TO service_role;
ALTER TABLE public.informe_alertas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.informe_historicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL UNIQUE,
  metricas jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.informe_historicos TO service_role;
ALTER TABLE public.informe_historicos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER informe_alertas_updated_at BEFORE UPDATE ON public.informe_alertas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER informe_historicos_updated_at BEFORE UPDATE ON public.informe_historicos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();