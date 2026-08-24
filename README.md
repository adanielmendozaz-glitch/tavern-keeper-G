# Tavern Keeper G — V0.5

V0.5 convierte la taberna en una operación viva: el personal ya no es un número global, sino una plantilla asignada a puestos reales que cambian el rendimiento de cada jornada.

## Novedades V0.5

- Puestos operativos: Salón, Barra, Cocina, Recepción y Despensa.
- Asignación directa desde el expediente de cada trabajadora.
- Descansar quita a una trabajadora del turno; activarla vuelve a incorporarla.
- Salón influye en velocidad y satisfacción de mesas.
- Barra influye directamente en ventas de cerveza.
- Cocina determina la producción real de platos; sin cocinera asignada la venta de comida cae de forma fuerte.
- Recepción mejora hospitalidad, demanda y atención VIP.
- Despensa reduce el riesgo de merma.
- Panel de cobertura operativa con puestos cubiertos/vacantes.
- Personal visible sobre la escena de taberna en función del puesto asignado.
- Indicador de aforo de la última jornada y preparación operativa.
- Fatiga distinta según la carga del puesto.
- La jornada registra puestos sin cubrir y la preparación del turno.
- Migración automática de partidas V0.4 al esquema V0.5.

## Actualización Android sin desinstalar

El proyecto conserva el mismo `appId`: `com.alfonso.tavernkeeper`.

Desde V0.5, GitHub Actions usa una clave de desarrollo fija incluida en `android-dev/tavernkeeper-dev.jks`, y V0.5 usa `versionCode 5` / `versionName 0.5.0`.

Esto permite instalar V0.6, V0.7, etc. encima de V0.5 siempre que:

1. se conserve el mismo `appId`;
2. se siga usando la misma clave DEV;
3. cada APK aumente `versionCode`.

La clave incluida es deliberadamente una clave de DESARROLLO. No debe utilizarse para una futura publicación en Google Play.

## Compilación

Al hacer push a `main`, `.github/workflows/android-debug.yml` genera un APK Android firmado con la clave DEV estable y lo publica como artifact de GitHub Actions.

## Guardado

La partida se conserva en almacenamiento local de la aplicación y V0.5 migra el guardado existente automáticamente.
