CREATE TABLE public.cotizaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_cliente text NOT NULL,
  modo text NOT NULL,
  productos jsonb NOT NULL,
  cliente jsonb,
  capacidad jsonb,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.cotizaciones TO anon;
GRANT SELECT, INSERT, DELETE ON public.cotizaciones TO authenticated;
GRANT ALL ON public.cotizaciones TO service_role;

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_public_read" ON public.cotizaciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cotizaciones_public_insert" ON public.cotizaciones FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "cotizaciones_public_delete" ON public.cotizaciones FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.limpiar_cotizaciones_vencidas()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.cotizaciones WHERE creado_en < now() - interval '30 days';
$$;