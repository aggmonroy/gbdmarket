CREATE TABLE public.formato_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  formato text NOT NULL,
  clave text NOT NULL,
  titulo text NOT NULL,
  fecha date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Panama')::date),
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  emitido_por uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente', 'anulado', 'eliminado')),
  impresiones integer NOT NULL DEFAULT 1,
  resuelto_en timestamptz,
  resuelto_por uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  motivo_resolucion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX formato_documentos_fecha_idx ON public.formato_documentos (fecha DESC, created_at DESC);
CREATE INDEX formato_documentos_emitido_idx ON public.formato_documentos (emitido_por, fecha DESC);

GRANT ALL ON public.formato_documentos TO service_role;
ALTER TABLE public.formato_documentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER formato_documentos_updated_at
  BEFORE UPDATE ON public.formato_documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.formato_documento_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.formato_documentos(id) ON DELETE CASCADE,
  accion text NOT NULL CHECK (accion IN ('anular', 'eliminar')),
  motivo text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  solicitado_por uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  solicitado_en timestamptz NOT NULL DEFAULT now(),
  resuelto_por uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  resuelto_en timestamptz,
  nota_resolucion text
);
CREATE UNIQUE INDEX formato_documento_solicitudes_pendiente_uidx
  ON public.formato_documento_solicitudes (documento_id) WHERE estado = 'pendiente';

GRANT ALL ON public.formato_documento_solicitudes TO service_role;
ALTER TABLE public.formato_documento_solicitudes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tareas
  ADD COLUMN formato_solicitud_id uuid REFERENCES public.formato_documento_solicitudes(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.next_numero_documento(_fecha date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) + 1 INTO n FROM public.formato_documentos WHERE fecha = _fecha;
  RETURN 'DOC-' || to_char(_fecha, 'YYYYMMDD') || '-' || lpad(n::text, 3, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_numero_documento(date) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_numero_documento(date) TO service_role;