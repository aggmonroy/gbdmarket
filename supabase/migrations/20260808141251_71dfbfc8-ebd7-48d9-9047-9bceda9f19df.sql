ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS apoyo_a uuid REFERENCES public.colaboradores(id),
  ADD COLUMN IF NOT EXISTS aceptada_en timestamptz,
  ADD COLUMN IF NOT EXISTS finalizada_responsable_en timestamptz,
  ADD COLUMN IF NOT EXISTS finalizada_apoyo_en timestamptz,
  ADD COLUMN IF NOT EXISTS cerrada_en timestamptz,
  ADD COLUMN IF NOT EXISTS origen text,
  ADD COLUMN IF NOT EXISTS embroidery_request_id uuid REFERENCES public.embroidery_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_lead_id uuid REFERENCES public.whatsapp_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documento_url text;

ALTER TABLE public.tareas DROP CONSTRAINT IF EXISTS tareas_estado_check;
ALTER TABLE public.tareas
  ADD CONSTRAINT tareas_estado_check CHECK (estado IN ('pendiente','aceptada','en_proceso','finalizada','completada'));

UPDATE public.tareas SET cerrada_en = COALESCE(cerrada_en, completada_en::timestamptz) WHERE estado = 'completada';

CREATE INDEX IF NOT EXISTS tareas_asignado_a_idx ON public.tareas(asignado_a);
CREATE INDEX IF NOT EXISTS tareas_apoyo_a_idx ON public.tareas(apoyo_a);
CREATE INDEX IF NOT EXISTS tareas_estado_idx ON public.tareas(estado);
CREATE INDEX IF NOT EXISTS tareas_cerrada_en_idx ON public.tareas(cerrada_en);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS disponibilidad text NOT NULL DEFAULT 'en_stock';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_disponibilidad_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_disponibilidad_check CHECK (disponibilidad IN ('en_stock','bajo_pedido'));
ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT 0;

ALTER TABLE public.whatsapp_leads
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS notes text;

INSERT INTO public.categories (slug, name, description, icon, display_order)
SELECT 'bordados', 'Bordados', 'Servicios y productos de bordado industrial y personalizado', 'Scissors',
       COALESCE((SELECT MAX(display_order) + 1 FROM public.categories), 0)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'bordados');