# Design — fix-kraken-phantom-book-levels

## Context

Los conectores WS mantienen un `LocalBook` (Map precio→qty por lado) que se
actualiza con snapshots + deltas. Kraken v2 (`book`, depth 10) solo gestiona la
ventana top-10: cuando un nivel sale de la ventana porque entran precios
mejores, **no envía delete** — el cliente debe truncar su copia local tras cada
update (documentado en Kraken WS v2). Hoy `BookSide.apply()` solo borra con
`qty <= 0`, y `toArray()` capea el *display* a `depth` pero el Map conserva los
niveles huérfanos. Como bids se ordenan desc y asks asc, un bid fantasma alto o
un ask fantasma bajo queda **siempre** en el tope del array emitido. Resultado
observado en prod: libro de Kraken cruzado (bid > ask) durante horas y $62.9M
de P&L ficticio.

Agravante: `ExchangeConnector.depth = 15` mientras Kraken se suscribe con
`depth: 10` — hasta el cap de display admite 5 niveles que Kraken jamás va a
actualizar.

## Goals / Non-Goals

**Goals:**

- El libro local de Kraken refleja fielmente la ventana top-10 del exchange.
- Un libro internamente cruzado nunca llega al `ArbitrageEngine`.
- Recuperación automática ante corrupción (re-sync), sin intervención manual.
- Tests unitarios que cubran truncado y guard.

**Non-Goals:**

- Validación del checksum CRC32 de Kraken (mejora futura; el truncado +
  guard cubren el fallo observado con mucho menos código).
- Cambios en Bybit/OKX/Binance (OKX y Binance reemplazan el libro completo por
  mensaje; Bybit manda deletes explícitos para su ventana de 50).
- Cambios de API REST, SSE o frontend.

## Decisions

1. **`BookSide.truncate()` borra del Map, no solo del display.**
   Tras aplicar los updates de un mensaje, se ordena por mejor precio y se
   eliminan los niveles más allá de `depth`. Alternativa considerada: pasar de
   Map a array ordenado permanente — descartada, complica `apply()` O(1) y el
   hot path no lo necesita (depth ≤ 50, truncar tras cada mensaje es barato).

2. **El truncado se invoca desde el conector de Kraken con su depth real (10).**
   Es un requisito del protocolo de Kraken, no un comportamiento universal:
   Bybit mantiene ventana 50 con deletes explícitos, OKX/Binance resetean por
   mensaje. Alternativa: truncar siempre en `emit()` de la base — descartada
   porque mezclaría semánticas distintas por exchange y ocultaría el contrato.

3. **Depth por conector.** `ExchangeConnector.depth` pasa a ser sobreescribible
   y Kraken lo fija en 10, igual a su suscripción. Se elimina el mismatch 15/10.

4. **Guard de libro cruzado en `emit()` de la base, con auto-recovery.**
   Si `bids[0].price >= asks[0].price`: no se emite, se loguea `warn` y se
   fuerza re-sync cerrando el socket (`ws.close()` → el reconnect existente
   con backoff re-suscribe y Kraken re-manda snapshot). Alternativa: solo
   descartar la emisión — descartada porque el libro seguiría corrupto y el
   quote se volvería stale silenciosamente; reconectar restaura el dato.
   El guard vive en la base porque protege a *todos* los conectores (defensa
   en profundidad) y su costo es una comparación por emit.

5. **El estado corrupto acumulado (P&L ficticio) no se migra.** El estado es
   in-memory: el redeploy lo limpia automáticamente.

## Risks / Trade-offs

- [Reconexión en bucle si un exchange emitiera libros cruzados legítimos] →
  imposible en spot con un libro bien sincronizado; si ocurriera, el backoff
  exponencial existente (cap 30s) limita el impacto y el log `warn` lo hace
  visible.
- [Truncar en cada mensaje añade un sort O(n log n)] → n ≤ ~20 niveles en
  Kraken; despreciable frente al parse JSON del propio mensaje.
- [Sin checksum, otros desyncs sutiles (qty desactualizada dentro de la
  ventana) no se detectan] → aceptado; el guard de cruce ataja el caso dañino
  y el checksum queda como mejora futura documentada.

## Migration Plan

1. Merge a `dev` → PR → `main`.
2. Deploy a la VPS (redeploy limpia el estado in-memory, P&L vuelve a 0).
3. Verificar en prod: `/api/state` con los 4 exchanges `live`, libro de Kraken
   no cruzado, y P&L creciendo de forma realista (mayormente rechazos por fees).

Rollback: revertir el commit; no hay migración de datos.

## Open Questions

- Ninguna bloqueante. Checksum CRC32 de Kraken queda anotado como follow-up.
