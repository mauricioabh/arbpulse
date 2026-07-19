# Fix: niveles fantasma en el order book de Kraken

> Issue: [WAY-77](https://linear.app/wayool/issue/WAY-77/arb-niveles-fantasma-en-el-order-book-de-kraken-inflan-el-pandl) — `[ARB] Niveles fantasma en el order book de Kraken inflan el P&L ($62.9M ficticios)`

## Why

En producción el P&L realizado llegó a $62.9M ficticios: el libro local de Kraken quedó **cruzado** (bid 64,925.90 > ask 64,316.20, spread -609) con niveles viejos de hace horas (coinciden con el high/low de 24h de Kraken). El motor vio un arbitraje permanente de ~0.5% vendiendo en Kraken y ejecutó ~674k trades falsos. La causa: el conector de Kraken v2 nunca trunca el libro local al depth suscrito, y el protocolo de Kraken **no envía deletes** para niveles que salen de la ventana top-N — exige que el cliente trunque tras cada update.

## What Changes

- `BookSide` (`src/infrastructure/exchanges/local-book.ts`) gana un método `truncate()` que elimina del Map los niveles fuera de los mejores `depth` precios (no solo en el display).
- El conector de Kraken (`src/infrastructure/exchanges/kraken.ts`) trunca ambos lados tras aplicar cada update, usando el depth suscrito (10).
- Se corrige el mismatch de depth: el conector de Kraken suscribe y mantiene el mismo depth (hoy: base mantiene 15, suscripción pide 10).
- Guard de libro cruzado en `ExchangeConnector.emit()`: si `bids[0].price >= asks[0].price`, no se emite el libro, se loguea y se resetea el libro local para forzar re-sincronización (Kraken re-manda snapshot al reconectar/resuscribir).
- Documentación actualizada: skill `exchange-ws` (nota de truncado obligatorio en Kraken v2) y README si aplica.

## Capabilities

### New Capabilities

- `order-book-integrity`: mantenimiento correcto del libro local por exchange — truncado al depth suscrito en feeds delta (Kraken), detección de libro cruzado como señal de corrupción, y re-sincronización en lugar de emitir datos corruptos al motor.

### Modified Capabilities

<!-- ninguna: `observability` no cambia a nivel de requisitos -->

## Impact

- **Código:** `src/infrastructure/exchanges/local-book.ts`, `src/infrastructure/exchanges/kraken.ts`, `src/infrastructure/exchanges/base.ts`.
- **Tests:** nuevos unit tests de `BookSide.truncate` y del guard de libro cruzado.
- **Comportamiento:** el motor deja de recibir libros corruptos; el P&L vuelve a ser realista (mayormente `rejected · fees`, que es lo correcto en mercados eficientes).
- **Sin cambios de API/contrato REST ni de frontend.** Tras el deploy se requiere un Reset manual del estado para limpiar el P&L ficticio acumulado (estado in-memory: el redeploy ya lo limpia solo).
