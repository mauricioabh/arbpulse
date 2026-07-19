# order-book-integrity

## ADDED Requirements

### Requirement: Truncado del libro local al depth suscrito en feeds delta

`BookSide` SHALL exponer una operación `truncate()` que elimine del estado
interno (no solo de la salida) todos los niveles de precio más allá de los
mejores `depth` niveles del lado (bids: precios más altos; asks: precios más
bajos). El conector de Kraken SHALL invocar el truncado en ambos lados tras
aplicar cada mensaje `update`, usando el mismo depth con el que se suscribió
al canal `book`.

#### Scenario: Nivel que sale de la ventana top-N se elimina

- **WHEN** el libro local de bids contiene `depth` niveles y un update añade un
  bid con precio mejor que todos los existentes
- **THEN** tras el truncado el nivel con peor precio ya no existe en el estado
  interno del `BookSide` y el tamaño del lado es exactamente `depth`

#### Scenario: Bid fantasma no sobrevive al movimiento del mercado

- **WHEN** el precio de mercado baja y sucesivos updates llenan la ventana
  top-N con precios inferiores a un bid antiguo que Kraken ya no reporta
- **THEN** el bid antiguo es eliminado por truncado y el mejor bid emitido
  refleja la ventana real del exchange

### Requirement: Depth del conector consistente con la suscripción

Cada conector SHALL mantener su libro local con el mismo depth que solicita en
su suscripción. El conector de Kraken SHALL usar depth 10 tanto en el mensaje
de suscripción como en su `LocalBook`.

#### Scenario: Sin niveles residuales por mismatch de depth

- **WHEN** el conector de Kraken arranca y se suscribe al canal `book`
- **THEN** el depth del `LocalBook` es igual al depth de la suscripción (10)

### Requirement: Guard de libro cruzado con re-sincronización

`ExchangeConnector` SHALL detectar antes de emitir cuando el libro normalizado
está internamente cruzado (`bids[0].price >= asks[0].price`). En ese caso el
conector MUST NOT emitir el libro a los listeners, SHALL registrar el evento en
el log, y SHALL forzar una re-sincronización (reset del libro local y
reconexión del WebSocket para recibir un snapshot fresco).

#### Scenario: Libro cruzado no llega al motor

- **WHEN** el libro local de un exchange queda con mejor bid ≥ mejor ask
- **THEN** no se emite ningún `OrderBook` a los listeners y el
  `ArbitrageEngine` no evalúa ese libro

#### Scenario: Recuperación automática tras corrupción

- **WHEN** se detecta un libro cruzado
- **THEN** el conector resetea su libro local y fuerza reconexión, y tras el
  snapshot de re-suscripción vuelve a emitir libros consistentes sin
  intervención manual
