ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'tarea',
  ADD COLUMN IF NOT EXISTS numero_orden text,
  ADD COLUMN IF NOT EXISTS fecha date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES public.colaboradores(id),
  ADD COLUMN IF NOT EXISTS completada_por uuid REFERENCES public.colaboradores(id),
  ADD COLUMN IF NOT EXISTS nota_cierre text,
  ADD COLUMN IF NOT EXISTS bitacora_id uuid REFERENCES public.bitacora(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS tareas_numero_orden_key ON public.tareas(numero_orden) WHERE numero_orden IS NOT NULL;
CREATE INDEX IF NOT EXISTS tareas_fecha_idx ON public.tareas(fecha);
CREATE INDEX IF NOT EXISTS tareas_tipo_idx ON public.tareas(tipo);

DROP TRIGGER IF EXISTS tareas_updated_at ON public.tareas;
CREATE TRIGGER tareas_updated_at BEFORE UPDATE ON public.tareas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.tarea_correlativo;

CREATE OR REPLACE FUNCTION public.next_numero_tarea(_fecha date, _prefijo text DEFAULT 'TAR')
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT _prefijo || '-' || to_char(_fecha, 'YYYYMMDD') || '-' || lpad(nextval('public.tarea_correlativo')::text, 4, '0')
$$;

REVOKE ALL ON FUNCTION public.next_numero_tarea(date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_numero_tarea(date, text) TO service_role;
GRANT ALL ON public.tareas TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.tarea_correlativo TO service_role;