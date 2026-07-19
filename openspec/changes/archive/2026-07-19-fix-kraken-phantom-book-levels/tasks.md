# Tasks — fix-kraken-phantom-book-levels

## 1. LocalBook: truncado real

- [x]  Añadir `BookSide.truncate()` que elimine del Map los niveles fuera de los mejores `depth` precios del lado
- [x]  Unit tests de `truncate()`: elimina el peor nivel al exceder depth, no toca nada si size <= depth, y el bid fantasma desaparece tras updates sucesivos

## 2. Conector Kraken

- [x]  Hacer `ExchangeConnector.depth` sobreescribible por subclase e inicializar `LocalBook` con el depth del conector
- [x]  Fijar depth 10 en `KrakenConnector` (igual a la suscripción) y truncar ambos lados tras aplicar cada update

## 3. Guard de libro cruzado

- [x]  En `ExchangeConnector.emit()`: si `bids[0].price >= asks[0].price`, no emitir, log warn, reset del libro y reconexión para re-sync
- [x]  Unit test del guard: libro cruzado no se emite a listeners y dispara re-sync

## 4. Documentación

- [x]  Actualizar skill `exchange-ws` (truncado obligatorio en Kraken v2, guard de cruce en la base, depth por conector)
- [x]  Revisar README/AGENTS por menciones al manejo del libro que queden desactualizadas

## 5. Verificación

- [x]  `npm run typecheck` + `npm test` en verde
- [x]  Arrancar en local con feeds reales y verificar via `/api/state` que Kraken emite libro no cruzado y quotes coherentes con el mercado (matar el proceso al terminar)
