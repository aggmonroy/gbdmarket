ALTER TABLE public.informes_mensuales
  ADD COLUMN IF NOT EXISTS explicaciones jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS layout jsonb NOT NULL DEFAULT '{}'::jsonb;