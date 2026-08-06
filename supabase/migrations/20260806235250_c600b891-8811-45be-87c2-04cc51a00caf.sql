ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

CREATE TABLE public.admin_login_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_login_challenges_user_idx ON public.admin_login_challenges (user_id, created_at DESC);
GRANT ALL ON public.admin_login_challenges TO service_role;
ALTER TABLE public.admin_login_challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_trusted_devices_user_idx ON public.admin_trusted_devices (user_id);
GRANT ALL ON public.admin_trusted_devices TO service_role;
ALTER TABLE public.admin_trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER admin_trusted_devices_updated_at BEFORE UPDATE ON public.admin_trusted_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();