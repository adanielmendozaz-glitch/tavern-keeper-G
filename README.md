# Tavern Keeper G — V0.9.2 HOTFIX

Corrige un bloqueo de la jornada viva introducido en V0.9.

## Problema
Al llegar a ciertos momentos de la jornada puede aparecer una decisión de gerencia.
El modal de esa decisión estaba detrás del overlay de la jornada, por lo que el juego
quedaba esperando una respuesta invisible. Al pulsar “Resolver jornada” parecía no pasar nada.

## Corrección
- El modal de decisiones ahora se muestra por encima de la jornada viva.
- Los avisos/toasts también se muestran por encima.
- “Resolver jornada” vuelve a abrir la decisión pendiente si existe.
- Conserva la partida y todas las funciones de V0.9.1.

## Android
- appId: com.alfonso.tavernkeeper
- versionCode: 11
- versionName: 0.9.2
- misma firma DEV estable
