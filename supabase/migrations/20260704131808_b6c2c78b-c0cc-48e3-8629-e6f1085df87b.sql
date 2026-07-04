
-- Public usage tracking table
CREATE TABLE public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,             -- page_view | product_view | whatsapp_click | form_submit | cta_click
  path text,
  product_id uuid,
  category_slug text,
  referrer text,
  session_id text,                       -- anonymous rotating id from localStorage
  user_agent text,
  meta jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_events TO anon;
GRANT INSERT ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page events"
ON public.page_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read page events"
ON public.page_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX page_events_created_at_idx ON public.page_events (created_at DESC);
CREATE INDEX page_events_event_type_idx ON public.page_events (event_type, created_at DESC);
CREATE INDEX page_events_path_idx ON public.page_events (path);
CREATE INDEX page_events_product_idx ON public.page_events (product_id) WHERE product_id IS NOT NULL;

-- Speed up audit log filtering / export
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_type_idx ON public.audit_log (entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON public.audit_log (user_id, created_at DESC);
