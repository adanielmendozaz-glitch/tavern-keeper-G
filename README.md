# Tavern Keeper G — V0.6

V0.6 convierte la jornada en una experiencia viva y dirigible sin abandonar la línea visual de V0.5.

## Jornada viva

- La taberna abre una jornada de 6 horas virtuales (18:00–00:00).
- Duración aproximada: 2 minutos a 1×, 1 minuto a 2× y 30 segundos a 4×.
- Clientes individuales entran, esperan mesa, hacen pedidos, consumen y se marchan.
- Se muestran ocupación, caja, clientes servidos y clientes perdidos en tiempo real.
- Tipos: campesinos, mercaderes, aventureros, guardias y nobles.
- Cada segmento tiene paciencia, preferencias y gasto diferentes.
- El servicio lento provoca abandonos.
- Falta de barra o cocina ralentiza los pedidos que dependen de esos puestos.
- Propinas ligadas a satisfacción y tipo de cliente.
- Eventos durante el turno: grupos de mercaderes, peleas, música, nobles y rondas.
- Clientes muy satisfechos pueden convertirse en habituales y regresar en jornadas posteriores.

## Dirección de personal durante el servicio

- Las trabajadoras permanecen operativas por puestos: Salón, Barra, Cocina, Recepción y Despensa.
- Durante la jornada se puede tocar una trabajadora para moverla al siguiente puesto compatible.
- La simulación recalcula el rendimiento inmediatamente.
- La fatiga al final del turno depende del tiempo trabajado y de la carga del puesto.
- Moral, lealtad y experiencia siguen evolucionando.

## Informe de jornada

Registra:

- llegadas;
- clientes servidos y perdidos;
- pico de ocupación;
- espera promedio;
- bebidas y platos vendidos;
- propinas;
- eventos;
- nuevos habituales;
- ingresos, gastos y beneficio neto.

## Actualización Android

- `appId`: `com.alfonso.tavernkeeper`
- `versionCode`: `6`
- `versionName`: `0.6.0`
- Misma firma DEV estable introducida en V0.5.

Por tanto, una APK V0.6 generada por este repositorio debe instalarse como **actualización encima de V0.5**, conservando la partida local.

La clave incluida en `android-dev/` es exclusivamente de desarrollo y no debe usarse para publicar el juego en una tienda.

## Compilación

Al hacer push a `main`, GitHub Actions genera el artifact `tavern-keeper-G-v0.6-apk`.
