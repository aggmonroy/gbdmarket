ALTER TYPE public.bitacora_estado ADD VALUE IF NOT EXISTS 'pre_orden';
ALTER TYPE public.bitacora_estado ADD VALUE IF NOT EXISTS 'notificado';
ALTER TYPE public.bitacora_estado ADD VALUE IF NOT EXISTS 'cerrado';

ALTER TABLE public.bitacora ADD COLUMN IF NOT EXISTS numero_pedido text;
ALTER TABLE public.bitacora ADD COLUMN IF NOT EXISTS descripcion text;
CREATE UNIQUE INDEX IF NOT EXISTS bitacora_numero_pedido_key ON public.bitacora (numero_pedido) WHERE numero_pedido IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS public.pedido_correlativo;

CREATE OR REPLACE FUNCTION public.next_numero_pedido(_fecha date)
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 'PO-' || to_char(_fecha, 'YYYYMMDD') || '-' || lpad(nextval('public.pedido_correlativo')::text, 4, '0')
$$;

CREATE TABLE IF NOT EXISTS public.security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'osv',
  total_packages integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  high_count integer NOT NULL DEFAULT 0,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_scans TO authenticated;
GRANT ALL ON public.security_scans TO service_role;
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read security scans" ON public.security_scans;
CREATE POLICY "Admins can read security scans"
ON public.security_scans FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));