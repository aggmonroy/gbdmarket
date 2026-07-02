
# Panel de administración extendido (/admin)

Ya existe la base: `/admin` protegido con `_authenticated`, con módulos de **Productos**, **Categorías/Marcas** y **Bordados**, más bootstrap del primer admin. Voy a extenderlo para cubrir todo el contenido editable del sitio sin volver a Lovable.

## 1. Base de datos (migración única)

Nuevas tablas en `public` con GRANTs + RLS (lectura pública, escritura solo admin):

- **`site_settings`** (key-value JSON): una fila por clave — `branding` (logo_url, nombre, colores primario/secundario/acento), `seo` (title, description, og_image, ga4_id, meta_pixel_id), `contact` (whatsapp principal, sucursales [{nombre, telefono, direccion, maps_url}], email, horarios), `social` (facebook, instagram, tiktok, youtube).
- **`content_blocks`** (key, title, subtitle, body, image_url, cta_label, cta_url, is_active, display_order): edita textos/banners/botones del Home, Hero slider, banners promocionales, secciones "Vocación", "Compras para todos", banner de bordados, etc. Cada bloque identificado por `key` estable (ej. `home.hero.slide1`).
- **`promotions`** (title, description, discount_pct, starts_at, ends_at, product_ids[], is_active): promos aplicables a productos.
- Ampliar **`products`**: ya tiene `is_published` (activar/desactivar) y `stock` — OK.

Storage bucket **`site-assets`** (público) para logos, banners e imágenes de bloques. Bucket **`product-images`** (público) para fotos de productos. Políticas: SELECT anon, INSERT/UPDATE/DELETE solo admins.

## 2. Server functions (`src/lib/*.functions.ts`)

Todos con `requireSupabaseAuth` + `has_role('admin')`:

- `site-settings.functions.ts`: `getSetting(key)` (público, sin auth), `getAllSettings` (admin), `upsertSetting(key, value)`.
- `content-blocks.functions.ts`: `listBlocks(prefix?)` (público con filtro `is_active`), `listAllBlocks` (admin), `upsertBlock`, `deleteBlock`, `reorderBlocks`.
- `promotions.functions.ts`: CRUD + `getActivePromotions` público.
- `uploads.functions.ts`: `uploadAsset({ bucket, path, base64 })` → devuelve URL pública (usa `supabaseAdmin.storage`).

Los `get*` públicos usan cliente publishable + políticas `TO anon`.

## 3. UI del panel (`src/routes/_authenticated.admin.*`)

Nuevas páginas añadidas al sidebar existente:

- `/admin/contenido` — lista de bloques agrupados por sección con edición inline (título, subtítulo, body richtext simple, imagen con uploader, CTA label/URL, activo, orden).
- `/admin/branding` — form de logo (uploader), nombre comercial, paleta de colores con color pickers (primario/secundario/acento), preview en vivo.
- `/admin/seo` — form de SEO por defecto + IDs de GA4 y Meta Pixel.
- `/admin/contacto` — WhatsApp principal, lista dinámica de sucursales (nombre/tel/dirección/maps), email, redes sociales.
- `/admin/promociones` — CRUD de promos con selector múltiple de productos.
- Reutiliza el layout existente `_authenticated.admin.tsx` (sidebar + navegación).

Componente compartido `<ImageUploader>` que sube al bucket y devuelve URL.

## 4. Consumo en el sitio público

- Hook `useSiteSettings()` y `useContentBlocks(prefix)` con TanStack Query.
- `SiteHeader` lee `branding.logo_url` y nombre; footer lee redes/contacto.
- `index.tsx` lee slides del Hero y banners desde `content_blocks` con fallback a los actuales (no rompe si la tabla está vacía).
- `__root.tsx` head() lee `seo.*` para title/description/og por defecto.
- Inyección de GA4 y Meta Pixel condicional en `__root.tsx` cuando existan IDs.
- Variables CSS de tema (`--primary`, etc.) sobrescritas en runtime desde `branding` (inyectando `<style>` en root).

Cambios reflejados inmediatamente vía invalidación de React Query en cada mutación admin.

## 5. Seed inicial

Migración incluye INSERTs con los valores actuales (logo actual, colores actuales, textos de hero, sucursales de Tonosí/Las Tablas/Casa Matriz/El Progreso, WhatsApp, etc.) para que nada se rompa al desplegar.

## Detalles técnicos

- Tablas: `id uuid pk`, `created_at`, `updated_at` + trigger `set_updated_at`.
- RLS: `SELECT` a `anon` en `site_settings`, `content_blocks (WHERE is_active)`, `promotions (WHERE is_active)`. `ALL` a admins vía `has_role(auth.uid(),'admin')`.
- Storage: policies en `storage.objects` para buckets `site-assets` y `product-images`.
- Sin dependencias nuevas — solo Supabase + shadcn ya presentes.

## Alcance / entregables

- 1 migración SQL.
- 4 server-fn modules + 1 uploads.
- 5 páginas admin nuevas + `ImageUploader`.
- Refactor de `SiteHeader`, `SiteFooter`, `index.tsx`, `__root.tsx` para leer de BD.

Confirma y ejecuto la migración + implementación.
