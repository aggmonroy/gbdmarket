ALTER TABLE public.cotizacion_solicitudes ADD COLUMN IF NOT EXISTS sucursal text;
ALTER TABLE public.garantias ADD COLUMN IF NOT EXISTS sucursal text;