
-- Restrict anon column-level access so draft fields are not readable publicly.
REVOKE SELECT ON public.content_blocks FROM anon;
GRANT SELECT (id, key, section, title, subtitle, body, image_url, cta_label, cta_url, is_active, display_order, created_at, updated_at) ON public.content_blocks TO anon;

REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (id, category_id, name, brand, model, code, description, features, price_cash, price_financed, stock, images, datasheet_url, manual_url, is_featured, is_published, views_count, quote_count, created_at, updated_at) ON public.products TO anon;

REVOKE SELECT ON public.site_settings FROM anon;
GRANT SELECT (id, key, value, created_at, updated_at) ON public.site_settings TO anon;
