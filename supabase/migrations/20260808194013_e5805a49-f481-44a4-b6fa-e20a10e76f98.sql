CREATE TABLE public.promociones_mes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo text NOT NULL UNIQUE,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  definido_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promociones_mes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promociones_mes TO authenticated;
GRANT ALL ON public.promociones_mes TO service_role;

ALTER TABLE public.promociones_mes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promos_mes_public_read" ON public.promociones_mes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "promos_mes_admin_write" ON public.promociones_mes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER promociones_mes_updated_at
  BEFORE UPDATE ON public.promociones_mes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.crear_tarea_promociones_mes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  periodo_siguiente text := to_char((date_trunc('month', now()) + interval '1 month')::date, 'YYYY-MM');
BEGIN
  IF EXISTS (SELECT 1 FROM public.tareas WHERE tipo = 'promociones' AND numero_orden = 'PROMO-' || periodo_siguiente) THEN
    RETURN;
  END IF;

  INSERT INTO public.tareas (titulo, descripcion, tipo, estado, numero_orden, fecha, fecha_vencimiento, origen)
  VALUES (
    'Elegir 12 promociones del mes ' || periodo_siguiente,
    'Selecciona en el panel de administración los 12 artículos en stock (excepto bordados) que serán las Promociones del mes ' || periodo_siguiente || '. Plazo: del 20 al 30 de este mes.',
    'promociones',
    'pendiente',
    'PROMO-' || periodo_siguiente,
    current_date,
    (date_trunc('month', now()) + interval '1 month - 1 day')::date,
    'sistema'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.crear_tarea_promociones_mes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_tarea_promociones_mes() TO service_role;