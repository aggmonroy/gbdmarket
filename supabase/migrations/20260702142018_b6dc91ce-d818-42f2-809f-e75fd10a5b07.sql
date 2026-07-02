
-- site_settings: key/value JSON store
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- content_blocks
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  section text NOT NULL DEFAULT 'general',
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active blocks" ON public.content_blocks FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage blocks" ON public.content_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER content_blocks_updated_at BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- promotions
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active promotions" ON public.promotions FOR SELECT
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for site-assets and product-images buckets (created via API)
CREATE POLICY "Public read site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admins write site-assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins write product-images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed initial site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('branding', jsonb_build_object(
    'name', 'Línea Blanca y Bordados GBD',
    'logo_url', '',
    'color_primary', '#0B4F6C',
    'color_secondary', '#C9A227',
    'color_accent', '#01BAEF'
  )),
  ('seo', jsonb_build_object(
    'title', 'Línea Blanca y Bordados GBD · Cooperativa Gladys B. de Ducasa',
    'description', 'Electrodomésticos, línea blanca y servicios de bordado con respaldo cooperativo. Financiamiento accesible.',
    'og_image', '',
    'ga4_id', '',
    'meta_pixel_id', ''
  )),
  ('contact', jsonb_build_object(
    'whatsapp_main', '+50767841941',
    'email', 'info@gbd.coop',
    'branches', jsonb_build_array(
      jsonb_build_object('name','Las Tablas','phone','+50767841941','address','Las Tablas, Los Santos','maps_url','https://maps.google.com/?q=Las+Tablas+Panama'),
      jsonb_build_object('name','Tonosí','phone','+50768711242','address','Tonosí, Los Santos','maps_url','https://maps.google.com/?q=Tonosi+Panama'),
      jsonb_build_object('name','Casa Matriz','phone','','address','Chitré','maps_url','https://maps.google.com/?q=Chitre+Panama'),
      jsonb_build_object('name','El Progreso','phone','','address','El Progreso','maps_url','https://maps.google.com/?q=El+Progreso+Panama')
    )
  )),
  ('social', jsonb_build_object(
    'facebook','', 'instagram','', 'tiktok','', 'youtube',''
  ))
ON CONFLICT (key) DO NOTHING;
