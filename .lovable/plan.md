# Actualización GBD Market

Reutilizo componentes existentes y no cambio la identidad visual. Trabajo en 4 bloques.

## 1. CMS ampliado (reutilizando el panel actual)

El panel `/admin` ya edita productos, categorías, contenido, promociones, branding, contacto, SEO y bordados. Amplío lo que falta sin duplicar pantallas:

- **Bordados GBD** → convertir la sección actual (hoy es `content_blocks` con `section='home.bordados'`) en un CRUD dedicado en `/admin/bordados-servicios`: imagen, nombre, descripción, orden, activo. Alta, edición, borrado y reordenamiento. La home lee de la nueva tabla `embroidery_services`.
- **WhatsApp / contacto / redes** → ya existe `/admin/contacto`; verifico que cubra los dos números (Línea Blanca y Bordados), correo y URLs de redes sociales, y me aseguro de que el sitio y footer los consuman desde `site_settings` (no hardcode en `whatsapp.ts`).
- **Textos, imágenes, banners, botones, categorías** → ya son editables vía `content_blocks`, `products`, `categories`, `promotions` y `site_settings`. Solo agrego los campos que aún estén hardcode en `index.tsx` (títulos hero, CTAs, tarjetas de financiamiento/garantías/contacto, thumbnails de categorías) como `content_blocks` con `section='home.hero'`, `home.info_cards`, `home.category_thumbs`.

## 2. Bitácora unificada + calendario

Reemplazo `whatsapp_leads` y `embroidery_requests` por una **única tabla `bitacora`** conectada a Catálogo, Financiamiento, Garantías, Contacto y Bordados, más cada clic de "Cotizar por WhatsApp".

Tabla `bitacora`:
- `id, created_at, fecha_entrega`
- `cliente_nombre, cliente_telefono, cliente_email`
- `producto_servicio, categoria`
- `origen` enum: `catalogo | financiamiento | garantia | contacto | bordados | whatsapp`
- `observaciones`
- `estado` enum: `pendiente | cotizado | en_proceso | produccion | listo | entregado | garantia | cancelado`
- `meta` jsonb (producto_id, monto financiado, etc.)
- `consent_accepted_at` (obligatorio)

Tabla `bitacora_historial`: `id, bitacora_id, estado_anterior, estado_nuevo, user_id, user_email, nota, created_at`. Se llena por trigger en cada cambio de estado + inserts manuales cuando el admin agrega nota.

Panel `/admin/bitacora`: lista con filtros por origen/estado/fecha, ficha con edición de estado, fecha de entrega, observaciones e historial visible.

Panel `/admin/calendario`: vista mensual/semana (reutilizando `Calendar` de shadcn + agrupación por día) con badges de estado y filtro por tipo (cotización, pedido, entrega, garantía). Al hacer clic en un evento abre la ficha con selector de estado. Fuente de datos: la misma `bitacora`.

Wiring de origen:
- `ProductDetailDialog` (WhatsApp cotización) → insert con origen `catalogo` o `whatsapp`.
- Formularios de `/financiamiento`, `/garantias`, `/contacto`, `/bordados` → insert con su origen.
- Botón flotante y links WhatsApp → insert liviano con origen `whatsapp`.

## 3. Protección de datos

- Componente reusable `<DataConsent />` (checkbox obligatorio + link a política) que envuelvo en todos los formularios existentes. Bloquea submit hasta aceptar y guarda `consent_accepted_at` en el registro `bitacora`.
- Nueva ruta pública `/privacidad` con la política redactada (uso para cotización/venta/garantía/atención, no se comparte salvo obligación legal, derecho a actualizar/eliminar y correo de contacto). Texto editable desde `content_blocks` `section='legal.privacy'`.
- Link a `/privacidad` en el footer.

## 4. Ajustes menores

- Footer: mostrar íconos de redes sociales usando URLs de `site_settings` (ya existen los campos, sólo hay que renderizarlos).
- Home: reemplazar el párrafo del hero por el nuevo texto solicitado.

## Detalles técnicos

- Nuevos archivos:
  - `supabase/migrations/*` con `embroidery_services`, `bitacora`, `bitacora_historial`, enums, RLS (admin lee/edita, anon sólo insert propio con consent obligatorio vía trigger), grants, triggers de historial y `updated_at`.
  - `src/lib/bitacora.functions.ts` (createServerFn público para inserts desde formularios; admin-only para list/update/historial).
  - `src/lib/embroidery-services.functions.ts` (CRUD admin + list público).
  - `src/components/site/DataConsent.tsx`.
  - `src/routes/_authenticated.admin.bitacora.tsx`, `_authenticated.admin.calendario.tsx`, `_authenticated.admin.bordados-servicios.tsx`.
  - `src/routes/privacidad.tsx`.
- Editados: `index.tsx` (texto hero + lectura de bordados desde nueva tabla), `SiteFooter.tsx` (redes + link privacidad), formularios de `/contacto`, `/financiamiento`, `/garantias`, `/bordados`, `ProductDetailDialog`, `WhatsAppFloat` para registrar interacciones.
- Los `whatsapp_leads`/`embroidery_requests` existentes se preservan (no destructivo); la app nueva escribe en `bitacora`. Opcionalmente migro los registros existentes.
- Sin cambios en la paleta, tipografías ni estructura visual pública.

¿Procedo con esta implementación?
