
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  code TEXT,
  description TEXT,
  features TEXT[],
  price_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_financed NUMERIC(10,2),
  stock INT NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  datasheet_url TEXT,
  manual_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  views_count INT NOT NULL DEFAULT 0,
  quote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read published" ON public.products FOR SELECT USING (is_published = true);
CREATE POLICY "products admin all" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_featured_idx ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX products_brand_idx ON public.products(brand);

-- ============ EMBROIDERY REQUESTS ============
CREATE TABLE public.embroidery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  colors TEXT,
  placement TEXT,
  notes TEXT,
  design_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.embroidery_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.embroidery_requests TO authenticated;
GRANT ALL ON public.embroidery_requests TO service_role;
ALTER TABLE public.embroidery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit embroidery" ON public.embroidery_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read embroidery" ON public.embroidery_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update embroidery" ON public.embroidery_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ WHATSAPP LEADS ============
CREATE TABLE public.whatsapp_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  customer_name TEXT,
  term_months INT,
  total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.whatsapp_leads TO anon, authenticated;
GRANT SELECT ON public.whatsapp_leads TO authenticated;
GRANT ALL ON public.whatsapp_leads TO service_role;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can log lead" ON public.whatsapp_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read leads" ON public.whatsapp_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories (slug, name, icon, display_order) VALUES
  ('aires-acondicionados', 'Aires Acondicionados', 'Wind', 1),
  ('refrigeradoras', 'Refrigeradoras', 'Refrigerator', 2),
  ('lavadoras', 'Lavadoras', 'WashingMachine', 3),
  ('estufas', 'Estufas', 'Flame', 4),
  ('congeladores', 'Congeladores', 'Snowflake', 5),
  ('microondas', 'Microondas', 'Microwave', 6),
  ('freidoras-aire', 'Freidoras de Aire', 'CookingPot', 7),
  ('electrodomesticos-menores', 'Electrodomésticos Menores', 'Blender', 8);
