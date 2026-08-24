# Tavern Keeper G — V0.4

V0.4 reconstruye la presentación del juego como un panel de gestión medieval serio y móvil, conservando la lógica y las partidas de V0.3.

## Cambios principales

- Rediseño visual completo: negro, madera, bronce y oro apagado.
- Se elimina el aspecto de prototipo infantil en la pantalla principal.
- Retratos semirrealistas utilizados como imagen real del personal.
- Nueva escena principal de taberna con arte ambiental integrado.
- Centro de mando con expediente de empleada, operación del salón, resultado financiero, inventario y rumores.
- Plantilla actual visible desde el resumen.
- Mercado laboral con cartas compactas y retratos.
- Adaptación móvil específica: sin desbordamiento horizontal de página, HUD desplazable contenido y navegación compacta.
- Interfaz de Personal, Finanzas, Cocina, Bodega y Mejoras reformada con el mismo lenguaje visual.
- Se mantiene contratación, moral, energía, lealtad, entrenamiento, descanso, asignaciones, salarios y habilidades.
- Migración automática de guardados anteriores a `schemaVersion 4`.
- Se incluye favicon para evitar el 404 del navegador de desarrollo.

## Prueba rápida

```bash
npm install
npm run check
python -m http.server 8080 -d www
```

Abre `http://127.0.0.1:8080` mientras el servidor esté activo.

## Android

El proyecto sigue preparado para Capacitor y para generar `app-debug.apk` con GitHub Actions al subir a `main`.
