import type { OrderBook } from "../../domain/entities/index.js";
import type { ArbitrageEngine } from "../../domain/services/arbitrage-engine.js";
import { withSpan } from "../../instrumentation/otel.js";
import {
  newCorrelationId,
  runWithCorrelation,
} from "../../infrastructure/logging/correlation.js";

export interface FeedRecorderPort {
  record(book: OrderBook): void;
}

/** Hot path: record optional NDJSON, then drive detection on the updated book. */
export class ProcessOrderBookUpdate {
  constructor(
    private readonly engine: ArbitrageEngine,
    private readonly recorder: FeedRecorderPort,
    private readonly isExchangeActive: (
      exchange: OrderBook["exchange"],
    ) => boolean,
  ) {}

  run(book: OrderBook): void {
    if (!this.isExchangeActive(book.exchange)) return;

    const correlationId = newCorrelationId("book");
    runWithCorrelation({ correlationId, exchange: book.exchange }, () => {
      void withSpan(
        "orderbook.process",
        { exchange: book.exchange, correlationId },
        async () => {
          this.recorder.record(book);
          await withSpan(
            "arbitrage.evaluate",
            { exchange: book.exchange, correlationId },
            async () => {
              this.engine.onBook(book);
            },
          );
        },
      );
    });
  }
}
