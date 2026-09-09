ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS verificador_a uuid REFERENCES public.colaboradores(id);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS verificada_en timestamp with time zone;
CREATE INDEX IF NOT EXISTS tareas_verificador_idx ON public.tareas (verificador_a);