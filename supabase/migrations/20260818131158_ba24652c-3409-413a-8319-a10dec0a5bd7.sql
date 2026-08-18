CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  nombre text,
  telefono text,
  intereses text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  consent_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX newsletter_subscribers_email_key ON public.newsletter_subscribers (lower(email));
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.newsletter_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  resumen text,
  cuerpo text,
  tipo text NOT NULL DEFAULT 'anuncio',
  image_url text,
  cta_label text,
  cta_url text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.newsletter_posts TO anon, authenticated;
GRANT ALL ON public.newsletter_posts TO service_role;
ALTER TABLE public.newsletter_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published_posts" ON public.newsletter_posts FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE TRIGGER newsletter_posts_updated_at BEFORE UPDATE ON public.newsletter_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();