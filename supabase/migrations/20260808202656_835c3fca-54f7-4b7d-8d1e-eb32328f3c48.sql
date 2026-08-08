CREATE SEQUENCE IF NOT EXISTS public.cotizacion_correlativo;

CREATE OR REPLACE FUNCTION public.next_numero_cotizacion(_fecha date)
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 'COT-' || to_char(_fecha, 'YYYYMMDD') || '-' || lpad(nextval('public.cotizacion_correlativo')::text, 4, '0')
$$;

REVOKE ALL ON FUNCTION public.next_numero_cotizacion(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_numero_cotizacion(date) TO service_role;

CREATE TABLE public.cotizacion_solicitudes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text NOT NULL UNIQUE,
  tipo_cliente text NOT NULL DEFAULT 'tercero',
  cliente jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas text,
  estado text NOT NULL DEFAULT 'pendiente',
  tarea_id uuid REFERENCES public.tareas(id) ON DELETE SET NULL,
  resultado jsonb,
  cotizacion_id uuid,
  atendida_por uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.cotizacion_solicitudes TO service_role;

ALTER TABLE public.cotizacion_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER cotizacion_solicitudes_updated_at
BEFORE UPDATE ON public.cotizacion_solicitudes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cotizacion_solicitudes_estado ON public.cotizacion_solicitudes (estado, created_at DESC);
CREATE INDEX idx_cotizacion_solicitudes_tarea ON public.cotizacion_solicitudes (tarea_id);