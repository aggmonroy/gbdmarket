-- Role management is done exclusively via server-side admin functions.
-- Removing this policy avoids RLS recursion once has_role is SECURITY INVOKER.
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;

-- Allow anon to evaluate has_role (returns no rows for anon under RLS).
GRANT SELECT ON public.user_roles TO anon;

-- has_role no longer runs as SECURITY DEFINER: it now reads user_roles under
-- the caller's own RLS context ("users read own roles").
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND user_id = auth.uid() AND role = _role
  )
$function$;

-- Trigger function stays SECURITY DEFINER but must not be callable via the API.
REVOKE ALL ON FUNCTION public.log_bitacora_estado_change() FROM PUBLIC, anon, authenticated;