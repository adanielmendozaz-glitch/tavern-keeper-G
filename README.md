# Tavern Keeper — V0.1

Primera versión jugable del proyecto **Tavern Keeper G**.

## Núcleo de juego
- Ciclo de jornadas: preparas el negocio y luego abres la taberna.
- Oro, reputación, capacidad y salarios.
- Inventario de cerveza y comida.
- Precios editables que afectan la demanda.
- Contratación de camareros y cocineros.
- Mejoras de mesas, cocina y bodega.
- Rumor/pronóstico diario: lluvia, mercado, caravanas, guardia, etc.
- Clientes simulados según reputación, precios, capacidad, personal y jornada.
- Eventos aleatorios: bardos, peleas, mercaderes, ratas y aventureros.
- Historial de jornadas.
- Guardado automático local y esquema preparado para migrar partidas en futuras versiones.

## Estructura
- `www/` contiene el juego.
- `capacitor.config.json` prepara el contenedor Android.
- `.github/workflows/android-debug.yml` permite generar un APK debug desde GitHub Actions.

## Probar en Termux
```bash
pkg install nodejs -y
npm install
npm run check
npm run serve
```

## Subir esta versión al repositorio oficial
Repositorio:
`https://github.com/adanielmendozaz-glitch/tavern-keeper-G.git`

Si el repositorio todavía está vacío:
```bash
cd ~
git clone https://github.com/adanielmendozaz-glitch/tavern-keeper-G.git
cd tavern-keeper-G
```

Copia o extrae dentro de esa carpeta los archivos de esta V0.1 y luego:
```bash
git add .
git commit -m "Tavern Keeper V0.1"
git push origin main
```

## Android / APK
Capacitor 8 convierte este proyecto web en una aplicación Android nativa.

```bash
npm install
npx cap add android
npx cap sync android
```

Con un entorno Android SDK/Gradle compatible:
```bash
cd android
./gradlew assembleDebug
```

APK esperado:
`android/app/build/outputs/apk/debug/app-debug.apk`

También se incluye un workflow de GitHub Actions que intenta construir automáticamente el APK en cada push a `main`.
