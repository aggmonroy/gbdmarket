-- 1. Cotizaciones: remove public read/delete, keep public insert only
DROP POLICY IF EXISTS "cotizaciones_public_read" ON public.cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_public_delete" ON public.cotizaciones;
REVOKE SELECT, UPDATE, DELETE ON public.cotizaciones FROM anon, authenticated;
GRANT INSERT ON public.cotizaciones TO anon, authenticated;
GRANT ALL ON public.cotizaciones TO service_role;

-- 2. PIN change requests: service-role only
REVOKE ALL ON public.colaborador_pin_solicitudes FROM anon, authenticated;
GRANT ALL ON public.colaborador_pin_solicitudes TO service_role;

-- 3. Internal / SECURITY DEFINER functions must not be callable from the API
REVOKE ALL ON FUNCTION public.limpiar_cotizaciones_vencidas() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.limpiar_cotizaciones_vencidas() TO service_role;

REVOKE ALL ON FUNCTION public.log_bitacora_estado_change() FROM anon, authenticated, PUBLIC;

REVOKE ALL ON FUNCTION public.next_numero_garantia(date) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.next_numero_pedido(date) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.next_numero_tarea(date, text) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_numero_garantia(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_numero_pedido(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_numero_tarea(date, text) TO service_role;

-- has_role stays callable by signed-in users (needed for role checks in the app)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;