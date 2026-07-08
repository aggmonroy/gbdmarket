
-- Enums
DO $$ BEGIN
  CREATE TYPE public.bitacora_origen AS ENUM ('catalogo','financiamiento','garantia','contacto','bordados','whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bitacora_estado AS ENUM ('pendiente','cotizado','en_proceso','produccion','listo','entregado','garantia','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bitácora principal
CREATE TABLE IF NOT EXISTS public.bitacora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  fecha_entrega date,
  cliente_nombre text NOT NULL,
  cliente_telefono text,
  cliente_email text,
  producto_servicio text,
  categoria text,
  origen public.bitacora_origen NOT NULL,
  observaciones text,
  estado public.bitacora_estado NOT NULL DEFAULT 'pendiente',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_accepted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bitacora TO authenticated;
GRANT INSERT ON public.bitacora TO anon;
GRANT ALL ON public.bitacora TO service_role;

ALTER TABLE public.bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bitacora"
  ON public.bitacora FOR INSERT TO anon, authenticated
  WITH CHECK (consent_accepted_at IS NOT NULL);

CREATE POLICY "Admins read bitacora"
  ON public.bitacora FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update bitacora"
  ON public.bitacora FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete bitacora"
  ON public.bitacora FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bitacora_updated_at BEFORE UPDATE ON public.bitacora
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_bitacora_estado ON public.bitacora(estado);
CREATE INDEX IF NOT EXISTS idx_bitacora_origen ON public.bitacora(origen);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha_entrega ON public.bitacora(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_bitacora_created_at ON public.bitacora(created_at DESC);

-- Historial de cambios
CREATE TABLE IF NOT EXISTS public.bitacora_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitacora_id uuid NOT NULL REFERENCES public.bitacora(id) ON DELETE CASCADE,
  estado_anterior public.bitacora_estado,
  estado_nuevo public.bitacora_estado NOT NULL,
  user_id uuid,
  user_email text,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bitacora_historial TO authenticated;
GRANT ALL ON public.bitacora_historial TO service_role;

ALTER TABLE public.bitacora_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read historial"
  ON public.bitacora_historial FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert historial"
  ON public.bitacora_historial FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_historial_bitacora ON public.bitacora_historial(bitacora_id, created_at DESC);

-- Trigger de historial automático al cambiar estado
CREATE OR REPLACE FUNCTION public.log_bitacora_estado_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bitacora_historial (bitacora_id, estado_anterior, estado_nuevo, user_id, nota)
    VALUES (NEW.id, NULL, NEW.estado, auth.uid(), 'Registro creado');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.bitacora_historial (bitacora_id, estado_anterior, estado_nuevo, user_id)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bitacora_historial_trigger ON public.bitacora;
CREATE TRIGGER bitacora_historial_trigger
  AFTER INSERT OR UPDATE ON public.bitacora
  FOR EACH ROW EXECUTE FUNCTION public.log_bitacora_estado_change();

-- Servicios de bordados (CRUD)
CREATE TABLE IF NOT EXISTS public.embroidery_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.embroidery_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.embroidery_services TO authenticated;
GRANT ALL ON public.embroidery_services TO service_role;

ALTER TABLE public.embroidery_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active embroidery services"
  ON public.embroidery_services FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage embroidery services"
  ON public.embroidery_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER embroidery_services_updated_at BEFORE UPDATE ON public.embroidery_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
