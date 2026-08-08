# Solicitudes Activas, Bitácora de casos cerrados y catálogo colaborativo

Un solo flujo: todo lo que llega del sitio público crea una **tarea pendiente**, se trabaja en **Solicitudes Activas** y, al cerrarse, pasa a la **Bitácora de casos cerrados**.

## 1. Toda solicitud genera una tarea pendiente

Hoy solo las pre-órdenes crean tarea. Se extiende a todos los orígenes:

- Pedidos de Línea Blanca y Bordados (ya funciona, se mantiene).
- Solicitudes de bordados de `/admin/bordados` (formulario público de la página de Bordados y del catálogo).
- Bitácora de interacciones: cotizaciones, contacto, financiamiento y garantías del sitio.
- Clics de WhatsApp: **antes de abrir WhatsApp se pide nombre y teléfono** (correo opcional). Con esos datos se registra la interacción y su tarea; sin datos no se genera el enlace.

Cada tarea guarda la referencia a su origen para poder abrir el caso completo e imprimirlo.

## 2. Estados y trabajo en equipo

Ciclo de la tarea:

```text
pendiente → aceptada (queda un responsable) → en proceso (puede sumar 1 colaborador de apoyo) → finalizada
```

- El admin puede asignar cualquier tarea a cualquier colaborador.
- Al **aceptar**, el colaborador queda como responsable.
- En **en proceso** se puede agregar un colaborador de apoyo.
- La tarea se cierra solo cuando **todos los involucrados** la marcan como finalizada. Con dos personas, hasta que ambas confirman queda "finalizada parcialmente" y sigue visible.
- Al completarse el cierre, desaparece de Solicitudes Activas y pasa a la Bitácora de casos cerrados.

## 3. Vista de colaboradores simplificada

El menú del portal queda como tablero de tarjetas clickeables:

- **Solicitudes Activas** (antes "Seguimiento consolidado"): todas las tareas pendientes con contadores por tipo (Línea Blanca, Bordados, Garantías, Interacciones) y por estado. Cada tarjeta abre el listado filtrado.
- **Bitácora de casos cerrados** (antes "Bitácora de pedidos"): solo casos cerrados, consultables por fecha/cliente/número, con vista de detalle imprimible.
- Tareas e incidencias, Garantías, Calendario y Panel administrativo se mantienen.

Visibilidad: un colaborador ve **solo** sus tareas (asignadas o de apoyo) más las que aún no tienen responsable. Admin y gerencia ven todo.

## 4. Reportes PDF con rango de fechas

En Solicitudes Activas y en la Bitácora de casos cerrados: selector "desde / hasta" y botón de reporte imprimible (PDF vía impresión del navegador) con número, cliente, tipo, responsables, fechas de apertura y cierre y **tiempo de respuesta** por caso, más promedios para evaluar capacidad de respuesta.

## 5. Catálogo: colaboradores y lectura con IA

- Los colaboradores (con su PIN) pueden crear productos; quedan **como borrador** y el admin los publica.
- Bordados se maneja como categoría dentro del catálogo general, con su propio catálogo administrable.
- **Lectura con IA**: se pega el enlace del proveedor, la IA lee la página y llena Nombre, Marca, Modelo, SKU/Código, Categoría, Descripción y Características (una por línea). Todo editable después. Precio y disponibilidad se llenan a mano.
- Se elimina el campo de cantidad de stock y se reemplaza por **Disponibilidad: En stock / Bajo pedido**.

## 6. Archivos y enlaces

En productos, bordados y evidencias: subida de imágenes grandes (hasta ~25 MB) y documentos (PDF, Word, Excel, imágenes, ZIP), con alternativa de **pegar un enlace** en cualquier campo de archivo.

## 7. PIN oculto

En el ingreso de colaboradores el PIN se escribe oculto (••••), con opción de mostrarlo.

---

## Detalles técnicos

**Base de datos (una migración)**

- `tareas`: nuevas columnas `estado` ampliado (`pendiente|aceptada|en_proceso|finalizada`), `apoyo_a uuid`, `aceptada_en`, `finalizada_responsable_en`, `finalizada_apoyo_en`, `origen text`, `embroidery_request_id uuid`, `whatsapp_lead_id uuid`, `cerrada_en timestamptz`.
- `products`: `disponibilidad text not null default 'en_stock'` con check (`en_stock|bajo_pedido`); `stock` se deja de usar en la UI (se mantiene la columna para no romper datos).
- `embroidery_requests` y `whatsapp_leads`: columnas de contacto obligatorias para el lead de WhatsApp (`customer_phone`).
- Índices por `asignado_a`, `apoyo_a`, `estado`, `cerrada_en`.

**Servidor**

- `src/lib/tareas.server.ts`: `crearTareaDeSolicitud` se generaliza a `crearTareaDeOrigen(origen, refs, resumen)`; se llama desde `pedidos.functions.ts`, `bitacora.functions.ts` (`registerBitacora`), una nueva `embroidery.functions.ts` pública (reemplaza el insert directo desde el cliente en `bordados.tsx` y `catalogo.tsx`) y desde el registro de lead de WhatsApp.
- `src/lib/tareas.functions.ts`: `aceptarTarea`, `agregarApoyo`, `finalizarTarea` (marca por rol y cierra cuando ambos), `asignarTarea` (admin), `solicitudesActivas` (agrupado para el tablero), `casosCerrados`, `reporteRespuesta` (rango de fechas).
- `listTareas` filtra por colaborador salvo admin/gerencia.
- `src/lib/productos-portal.functions.ts`: crear/editar producto con sesión PIN, siempre `is_published: false` + `has_draft: true`.
- `src/lib/ai-product.functions.ts`: server fn que descarga la página del proveedor y extrae la ficha con Lovable AI (`openai/gpt-5.6-sol`, salida estructurada Zod).
- `src/lib/uploads.functions.ts`: amplía tipos permitidos y límite de tamaño; admite `bordados` como bucket.

**Frontend**

- `src/routes/portal.tsx`: menú tipo dashboard, PIN con `type="password"` + toggle, vistas `solicitudes` y `cerrados`.
- Nuevos componentes en `src/components/portal/`: `SolicitudesActivas.tsx`, `CasosCerrados.tsx`, `TareaCard.tsx`, `ReporteRango.tsx`, `ProductoForm.tsx` (con lectura por enlace).
- `src/components/site/WhatsAppFloat.tsx`, `ProductDetailDialog.tsx`, `ProductCard.tsx`, `QuoteFormDialog.tsx`: diálogo de datos del cliente antes de abrir WhatsApp.
- `src/routes/_authenticated.admin.productos.tsx`: quita cantidad de stock, agrega Disponibilidad y el bloque de lectura con IA.
- Componente compartido de carga de archivos con opción de enlace.

**Orden de trabajo**

1. Migración de base de datos.
2. Generación de tareas en todos los orígenes + datos obligatorios en WhatsApp.
3. Ciclo de estados y visibilidad por colaborador.
4. Tablero Solicitudes Activas + Bitácora de casos cerrados + reportes PDF.
5. Catálogo: disponibilidad, lectura con IA, productos por colaboradores, bordados.
6. Carga de archivos ampliada y PIN oculto.
