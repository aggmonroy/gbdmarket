# GBD Market — Pedidos, Garantías y Portal de Colaboradores

Trabajo en 5 cloques optimizando tokens.  No cambio la   identidad visual del sitio público.

## 1. Pre-órdenes de pedido (Línea Blanca y Bordados)

Hoy los formularios abren WhatsApp y registran una entrada suelta en la bitácora. Nuevo flujo:

1. El cliente llena el formulario igual que ahora (catálogo, ficha de producto, bordados, contacto, financiamiento).
2. Al enviar se crea una **pre-orden** con número correlativo `PO-AAAAMMDD-0001` guardada en la bitácora.
3. Se abre un **documento de una sola vista** en `/pedido/{numero}`: datos del cliente, lista de productos/servicios, observaciones, número y fecha. Imprimible / descargable en PDF (impresión del navegador).
4. En ese documento hay un botón **"Enviar por WhatsApp"** que manda el texto completo del pedido al número correspondiente, exactamente como funciona hoy.

Estados de la bitácora de pedidos: `pre_orden → en_proceso → notificado → cerrado`, más un campo de **descripción/nota de seguimiento** editable. Cualquier colaborador puede cambiar estado y agregar notas; queda historial con fecha y autor.

## 2. Módulo de garantías: impresión sin segunda validación

- El reporte `/reporte-garantia/{id}` hoy exige sesión con PIN en el navegador y falla al imprimir. Paso a un **enlace firmado**: al crear la garantía o al guardar un seguimiento se genera un token de solo lectura incrustado en la URL; abrir ese enlace imprime sin pedir PIN.
- Botón **"Imprimir reporte"** visible: al terminar el registro de una garantía y en cada seguimiento guardado.
- El reporte incluye siempre los seguimientos al día.
- La validación por PIN se mantiene únicamente para **registrar y editar**.

## 3. Limpieza de datos de prueba

Elimino todas las garantías registradas hasta hoy con sus seguimientos, evidencias, solicitudes de cierre y tareas vinculadas, y reinicio el correlativo.

## 4. Rol gerente y calendario de tareas del día

- **Gerente = solo lectura total**: ve garantías abiertas y cerradas, bitácora de pedidos, calendario y reportes; no puede crear, editar, cerrar ni agregar seguimientos. Hoy tiene bloqueada la bitácora de cerradas: se la habilito en modo lectura.
- **Calendario con vista de día**: nueva pantalla que lista, por día, todas las tareas pendientes de **todos** los colaboradores (garantías por contactar, entregas de pedidos, seguimientos vencidos), con el nombre del responsable, alerta de +7 días sin contacto y acceso directo a la ficha. Cualquier colaborador puede darles seguimiento.

## 5. Portal de colaboradores desde el inicio

- Botón **"Acceso colaboradores"** en el inicio (header y/o pie).
- Pantalla de ingreso: el colaborador elige su nombre y escribe su **código PIN** (el esquema actual, sin correo ni contraseña).
- Tras ingresar ve un **menú de áreas según su rol**:
  - colaborador → Garantías, Bitácora de pedidos, Calendario, Mis tareas
  - gerente → las mismas en solo lectura
  - admin → todo lo anterior + validación de cierres y gestión de PIN

## 6. Seguridad automatizada — qué es posible

- **Reescaneo semanal + alertas: sí.** Programo una tarea semanal que revisa las dependencias del proyecto contra la base pública de vulnerabilidades (OSV), guarda el resultado y muestra una alerta en el panel admin cuando aparece algo nuevo (crítico/alto). Si quieres aviso por correo, lo agrego después con el dominio de correo del proyecto.
- **Bloquear releases con issues críticas: no es posible.** La publicación de Lovable no expone un paso de CI donde se pueda abortar el deploy. Lo que sí hago: una pantalla **"Estado de seguridad"** en el panel con semáforo del último escaneo, para revisar antes de publicar.

## Detalles técnicos

- Migración: nuevos valores de estado de bitácora (`pre_orden`, `notificado`, `cerrado`), columnas `numero_pedido`, `descripcion_seguimiento`, secuencia de correlativo diario; tabla `security_scans`; borrado de datos de prueba de garantías.
- Nuevos archivos: `src/routes/pedido.$numero.tsx`, `src/routes/portal.tsx` (login PIN + menú por rol), `src/routes/portal.calendario.tsx`, `src/routes/api/public/hooks/security-scan.ts`, `src/lib/pedidos.functions.ts`.
- Editados: `bitacora.functions.ts`, `garantias.functions.ts` / `.server.ts` (token de reporte de solo lectura, permisos de gerente), `reporte-garantia.$id.tsx`, `modulo-garantias.tsx`, `ProductDetailDialog.tsx`, `bordados.tsx`, `contacto.tsx`, `financiamiento.tsx`, `SiteHeader.tsx`, panel `/admin/bitacora`.
- Sin cambios en paleta, tipografías ni estructura visual pública.