ALTER TYPE public.garantia_via ADD VALUE IF NOT EXISTS 'Personalmente';
ALTER TYPE public.garantia_via ADD VALUE IF NOT EXISTS 'A domicilio';
ALTER TYPE public.garantia_via ADD VALUE IF NOT EXISTS 'Otro';

CREATE TABLE public.tarea_seguimientos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id uuid NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  via text NOT NULL,
  via_detalle text,
  texto text NOT NULL,
  creado_por uuid REFERENCES public.colaboradores(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.tarea_seguimientos TO service_role;
ALTER TABLE public.tarea_seguimientos ENABLE ROW LEVEL SECURITY;

CREATE INDEX tarea_seguimientos_tarea_idx ON public.tarea_seguimientos (tarea_id, created_at DESC);