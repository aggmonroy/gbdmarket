
-- Fix search_path en set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restringir ejecución de has_role (solo usada por políticas RLS, que corren como owner)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, PUBLIC;

-- Reforzar políticas INSERT públicas con validaciones mínimas
DROP POLICY IF EXISTS "anyone can submit embroidery" ON public.embroidery_requests;
CREATE POLICY "anyone can submit embroidery" ON public.embroidery_requests
  FOR INSERT WITH CHECK (
    length(trim(name)) BETWEEN 2 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 30
    AND length(trim(service_type)) BETWEEN 2 AND 80
    AND quantity > 0 AND quantity <= 100000
  );

DROP POLICY IF EXISTS "anyone can log lead" ON public.whatsapp_leads;
CREATE POLICY "anyone can log lead" ON public.whatsapp_leads
  FOR INSERT WITH CHECK (
    channel IN ('linea-blanca','bordados')
    AND (product_name IS NULL OR length(product_name) <= 200)
  );
