# Tavern Keeper G — V0.9.1 HOTFIX

Corrección crítica de V0.9.

## Qué se corrigió

V0.9 tenía dos fallos de inicialización heredados al combinar V0.7, V0.8 y V0.9:

1. El inicializador de compatibilidad de V0.7 quedó renombrado por error como `ensureV08State`, mientras el inicializador real de V0.8 llamaba a `ensureV07State()`. Esto detenía JavaScript antes del primer render.
2. El arquetipo de las candidatas V0.8 podía quedar guardado como objeto en vez de texto. Al aparecer una candidata especial (por ejemplo una elfa), el anuncio del mercado podía lanzar un error.

Síntomas visibles de V0.9:

- plantilla vacía;
- mercado laboral vacío;
- pestañas de taberna, finanzas y otras secciones sin contenido;
- renovar candidatas sin resultado visible;
- no se podía iniciar la jornada aunque hubiera personal;
- algunos valores estáticos del HTML seguían visibles, por lo que la app parecía cargar parcialmente.

V0.9.1 restaura la cadena correcta:

`ensureV07State()` → `ensureV08State()` → `ensureV09State()`

También normaliza los arquetipos antiguos y evita una conversión inconsistente de candidatas a elfa.

## Pruebas realizadas

- `node --check www/game.js`
- smoke test completo de inicialización con DOM simulado
- smoke test del botón **Abrir siguiente jornada**
- smoke test de **Renovar candidatas**

## Android

- `appId`: `com.alfonso.tavernkeeper`
- `versionCode`: `10`
- `versionName`: `0.9.1`
- artifact: `tavern-keeper-G-v0.9.1-apk`
- misma firma DEV de versiones anteriores

Se instala como actualización sobre V0.9 y conserva la partida local.
