
-- Replace the fully-permissive INSERT policy with a validated one
DROP POLICY IF EXISTS "Anyone can insert page events" ON public.page_events;

CREATE POLICY "Anyone can insert bounded page events"
ON public.page_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('page_view','product_view','whatsapp_click','form_submit','cta_click','quote_click')
  AND length(coalesce(path, '')) <= 300
  AND length(coalesce(referrer, '')) <= 500
  AND length(coalesce(session_id, '')) <= 80
  AND length(coalesce(user_agent, '')) <= 400
  AND length(coalesce(category_slug, '')) <= 80
);
