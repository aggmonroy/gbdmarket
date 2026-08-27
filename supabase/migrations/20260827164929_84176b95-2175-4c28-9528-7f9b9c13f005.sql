CREATE TABLE public.newsletter_difusiones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asunto text NOT NULL,
  post_ids uuid[] NOT NULL DEFAULT '{}',
  total_destinatarios integer NOT NULL DEFAULT 0,
  enviados integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente',
  error text,
  creado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.newsletter_difusiones TO authenticated;
GRANT ALL ON public.newsletter_difusiones TO service_role;
ALTER TABLE public.newsletter_difusiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_difusiones" ON public.newsletter_difusiones FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));