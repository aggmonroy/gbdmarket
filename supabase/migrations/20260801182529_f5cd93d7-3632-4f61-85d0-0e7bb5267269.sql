CREATE TYPE public.garantia_estado AS ENUM ('proceso','revision','cerrada_cliente_credito','cerrada_proveedor_cliente');
CREATE TYPE public.garantia_via AS ENUM ('Llamada','WhatsApp','Correo electrónico');
CREATE TYPE public.colaborador_rol AS ENUM ('colaborador','admin','gerente');

CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text,
  rol public.colaborador_rol NOT NULL DEFAULT 'colaborador',
  pin_hash text,
  pin_salt text,
  pin_bloqueado boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.colaborador_pin_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nuevo_pin_hash text NOT NULL,
  nuevo_pin_salt text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  solicitado_en timestamptz NOT NULL DEFAULT now(),
  resuelto_en timestamptz,
  resuelto_por uuid
);
CREATE UNIQUE INDEX colaborador_pin_solicitud_pendiente
  ON public.colaborador_pin_solicitudes (colaborador_id) WHERE estado = 'pendiente';
GRANT ALL ON public.colaborador_pin_solicitudes TO service_role;
ALTER TABLE public.colaborador_pin_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.garantia_correlativo START WITH 0 MINVALUE 0 INCREMENT BY 1;

CREATE TABLE public.garantias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_garantia text NOT NULL UNIQUE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cliente text NOT NULL,
  cedula_cliente text,
  telefono_cliente text,
  direccion_cliente text,
  numero_factura text,
  fecha_facturacion date,
  modelo_codigo text,
  descripcion_articulo text,
  dentro_15_dias boolean NOT NULL DEFAULT false,
  no_mal_uso boolean NOT NULL DEFAULT false,
  accion_realizada text,
  estado public.garantia_estado NOT NULL DEFAULT 'proceso',
  tramitado_por uuid NOT NULL REFERENCES public.colaboradores(id),
  fecha_cierre date,
  tarea_vinculada_id uuid,
  creado_en timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.garantias TO service_role;
ALTER TABLE public.garantias ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  asignado_a uuid REFERENCES public.colaboradores(id),
  garantia_id uuid REFERENCES public.garantias(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente',
  fecha_vencimiento date,
  completada_en date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tareas TO service_role;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.garantias
  ADD CONSTRAINT garantias_tarea_fk FOREIGN KEY (tarea_vinculada_id) REFERENCES public.tareas(id) ON DELETE SET NULL;

CREATE TABLE public.garantia_seguimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garantia_id uuid NOT NULL REFERENCES public.garantias(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  via public.garantia_via NOT NULL,
  texto text NOT NULL,
  creado_por uuid REFERENCES public.colaboradores(id),
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.garantia_seguimientos TO service_role;
ALTER TABLE public.garantia_seguimientos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.garantia_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garantia_id uuid NOT NULL REFERENCES public.garantias(id) ON DELETE CASCADE,
  url_imagen text NOT NULL,
  subido_por uuid REFERENCES public.colaboradores(id),
  subido_en timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.garantia_evidencias TO service_role;
ALTER TABLE public.garantia_evidencias ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.garantia_cierre_solicitud (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garantia_id uuid NOT NULL REFERENCES public.garantias(id) ON DELETE CASCADE,
  tipo_propuesto public.garantia_estado NOT NULL,
  nota_final text,
  numero_documento_subsanacion text,
  estado text NOT NULL DEFAULT 'pendiente',
  solicitado_por uuid REFERENCES public.colaboradores(id),
  solicitado_en timestamptz NOT NULL DEFAULT now(),
  resuelto_en timestamptz,
  resuelto_por uuid REFERENCES public.colaboradores(id)
);
CREATE UNIQUE INDEX garantia_cierre_pendiente_unico
  ON public.garantia_cierre_solicitud (garantia_id) WHERE estado = 'pendiente';
GRANT ALL ON public.garantia_cierre_solicitud TO service_role;
ALTER TABLE public.garantia_cierre_solicitud ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER colaboradores_updated_at BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER garantias_updated_at BEFORE UPDATE ON public.garantias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.next_numero_garantia(_fecha date)
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT to_char(_fecha, 'YYYY-MM-DD') || '-' || lpad(nextval('public.garantia_correlativo')::text, 4, '0')
$$;
REVOKE ALL ON FUNCTION public.next_numero_garantia(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_numero_garantia(date) TO service_role;