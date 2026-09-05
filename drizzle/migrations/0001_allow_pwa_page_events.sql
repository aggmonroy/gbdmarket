DROP POLICY IF EXISTS "Anyone can insert bounded page events" ON public.page_events;

CREATE POLICY "Anyone can insert bounded page events"
ON public.page_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type = ANY (ARRAY[
    'page_view','product_view','whatsapp_click','form_submit','cta_click','quote_click',
    'pwa_prompt','pwa_install','pwa_dismiss','pwa_launch'
  ])
  AND length(COALESCE(path, '')) <= 300
  AND length(COALESCE(referrer, '')) <= 500
  AND length(COALESCE(session_id, '')) <= 80
  AND length(COALESCE(user_agent, '')) <= 400
  AND length(COALESCE(category_slug, '')) <= 80
  AND length(COALESCE(meta::text, '')) <= 1000
);

GRANT INSERT ON public.page_events TO anon;
GRANT SELECT, INSERT ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;

CREATE INDEX IF NOT EXISTS page_events_type_created_idx ON public.page_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS page_events_created_idx ON public.page_events (created_at DESC);