# Insertar la página de inicio de GBD Market en coopgbd.com

## Qué se entrega

1. Un **modo embebido**: `https://gbdmarket.lovable.app/?embed=1` muestra la página limpia (sin cabecera, sin pie de página, sin WhatsApp flotante y sin "Descargar App"), lista para meter dentro de una caja en coopgbd.com.
2. Una tarjeta en el panel de administración con los tres códigos listos para copiar y pegar, y las instrucciones para quien administra coopgbd.com.

Hoy la página **sí permite que la incrusten** (no envía cabeceras que bloqueen marcos), así que la caja funcionará; lo que falta es que se vea bien.

## 1. Modo embebido (`?embed=1`)

- Nuevo módulo `src/lib/embed.ts` con un detector `useEmbedMode()` que lee `embed=1` de la URL y lo recuerda en el navegador, de forma que al pasar de la portada al catálogo o al boletín dentro de la caja se siga viendo limpia.
- `src/routes/__root.tsx`: en modo embebido no se montan `SiteHeader`, `SiteFooter`, `WhatsAppFloat`, el aviso de datos ni el botón "Descargar App".
- El contenido de la portada (Mueblería, destacados, promociones, Instagram, cobertura, trayectoria) se mantiene igual.
- Los botones que sacan al cliente del sitio (banca en línea, WhatsApp, enlaces a coopgbd.com) se abren en la ventana completa en lugar de dentro de la caja.
- La versión embebida se marca como "no indexar" para que Google no la cuente como copia del contenido real.
- El sitio normal (`https://gbdmarket.lovable.app`) no cambia en nada.

## 2. Tarjeta "Insertar en coopgbd.com" en el panel

En la pantalla de inicio del panel administrativo se agrega una tarjeta con tres bloques, cada uno con botón **Copiar**:

```text
A) Caja incrustada (iframe)
<iframe src="https://gbdmarket.lovable.app/?embed=1"
        title="Mueblería GBD" loading="lazy"
        style="width:100%;height:900px;border:0;border-radius:16px"></iframe>

B) Botón / ítem de menú
Texto: Mueblería GBD   →   https://gbdmarket.lovable.app

C) Subdominio propio (la opción más profesional)
muebleria.coopgbd.com   →   se conecta en Project settings > Domains
```

Debajo, una nota breve con los puntos que hay que explicar al equipo de la cooperativa:

- La caja incrustada **no** cuenta como contenido de coopgbd.com para Google; el subdominio propio sí.
- Dentro de una caja no se puede instalar la app en el teléfono; por eso el enlace o el subdominio son mejores para ese objetivo.
- El subdominio requiere plan de pago y que quien administra coopgbd.com agregue un registro de dominio apuntando a esta app.

## Verificación

- Comprobar con el navegador, en escritorio y en el celular, que `?embed=1` muestra la portada sin cabecera, pie ni botón flotante, y que el catálogo y el boletín siguen navegables dentro de la caja.
- Comprobar que la dirección sin parámetro sigue mostrando el sitio completo como ahora.
- Revisar que no haya errores en la consola y que el chequeo de tipos del proyecto pase.
