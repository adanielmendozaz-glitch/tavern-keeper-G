# Tavern Keeper G — V0.7

V0.7 profundiza dos sistemas centrales: la economía de la taberna y el mercado laboral.

## Economía por producto

La taberna deja de operar solamente con “cerveza” y “raciones”. Ahora existen seis productos distintos:

- Cerveza rubia
- Vino especiado
- Hidromiel dorada
- Estofado de la casa
- Asado especiado
- Tabla de queso

Cada uno tiene:

- inventario propio;
- coste unitario aproximado;
- precio de venta editable;
- margen;
- requisito de reputación;
- demanda distinta según el tipo de cliente.

El menú se puede activar/desactivar producto por producto. Durante la jornada viva, los clientes piden según sus preferencias y el stock se descuenta realmente. Se muestran alertas de inventario bajo y productos agotados.

## Proveedores

- Mercado local: coste normal.
- Caravana mayorista: 10% más barata y lotes mayores; requiere reputación 18.
- Gremio de Brumavieja: 18% más barato; requiere reputación 35.

Las compras actualizan el coste medio de inventario. El informe de jornada calcula coste de producto vendido, ticket medio y margen por producto.

## Mercado laboral procedural

Cada renovación genera candidatas nuevas con nombre, edad adulta, rol, personalidad, stats, salario, especialidad, atuendo y retrato.

Distribución base por candidata:

- Común: 55%
- Competente: 27%
- Experta: 12%
- Élite: 5%
- Prodigio: 0.9%
- Genio: 0.1%

Las Prodigio y Genio disparan un anuncio especial en el mercado laboral. Las Genio tienen estadísticas excepcionalmente altas, una bonificación de eficiencia propia y costes salariales/de contratación muy elevados. No existe sistema de “pity”: encontrarlas debe sentirse realmente extraordinario.

Las candidatas raras también pueden llevar atuendos de fantasía medieval más atrevidos y distintivos, siempre como personajes adultos.

## Mercado dinámico

Además de pagar 8 oro para renovar manualmente, existe una probabilidad de que nuevas candidatas lleguen automáticamente después de una jornada.

## Android

- `appId`: `com.alfonso.tavernkeeper`
- `versionCode`: `7`
- `versionName`: `0.7.0`
- Misma firma DEV de V0.5/V0.6.

La APK debe instalarse como actualización sobre V0.6 y conservar la partida local.

GitHub Actions genera el artifact `tavern-keeper-G-v0.7-apk`.
