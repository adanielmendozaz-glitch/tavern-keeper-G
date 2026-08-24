# Tavern Keeper G — V0.9.3 STABLE

Versión de estabilización previa a seguir añadiendo contenido.

## Correcciones

- Guardado automático de la jornada viva y recuperación al reabrir la app.
- Las decisiones pendientes también reaparecen al recuperar una jornada.
- Compras/promoción de la caravana quedan reflejadas en los gastos sin cobrarse dos veces.
- Las visitas VIP aleatorias solo se anuncian si el cliente realmente entra; se evita generar visitas especiales demasiado tarde.
- El pie de interfaz muestra correctamente V0.9.3.
- Pausa, velocidad y reasignación de personal generan checkpoint.

## Validación nueva

`npm run check` ya no revisa solo sintaxis. Ahora también ejecuta un smoke test que valida:

- arranque y render básico,
- mercado laboral procedural,
- todas las ramas de decisiones de gerencia,
- una jornada completa,
- contabilidad de gastos directos,
- guardado/reanudación de jornada,
- referencias a assets.

## Android

- appId: `com.alfonso.tavernkeeper`
- versionCode: `12`
- versionName: `0.9.3`
- misma firma DEV estable
