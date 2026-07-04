
-- Rewrite public policies to stop referencing has_role for anon
DROP POLICY IF EXISTS "Public read active blocks" ON public.content_blocks;
CREATE POLICY "Public read active blocks"
ON public.content_blocks FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins read all blocks"
ON public.content_blocks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public read active promotions" ON public.promotions;
CREATE POLICY "Public read active promotions"
ON public.promotions FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins read all promotions"
ON public.promotions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Revoke public execute of the role-check function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
