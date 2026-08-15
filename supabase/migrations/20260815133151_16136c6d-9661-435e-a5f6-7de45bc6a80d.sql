ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS listo_entrega_en timestamptz,
  ADD COLUMN IF NOT EXISTS resultado_cierre text;

ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS duracion_segundos integer;