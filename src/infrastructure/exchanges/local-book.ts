import type { Level } from "../../domain/entities/index.js";

/**
 * Maintains one side of an order book from snapshot + incremental deltas.
 * Internally a price->qty map; emits a sorted, depth-capped array on demand.
 * A qty of 0 removes the price level (standard exchange convention).
 */
export class BookSide {
  private levels = new Map<number, number>();

  constructor(
    private readonly side: "bid" | "ask",
    private readonly depth: number,
  ) {}

  clear(): void {
    this.levels.clear();
  }

  apply(price: number, qty: number): void {
    if (qty <= 0) {
      this.levels.delete(price);
    } else {
      this.levels.set(price, qty);
    }
  }

  /**
   * Remove levels beyond the best `depth` prices from the internal map.
   * Required by delta feeds that do NOT send deletes for levels evicted from
   * their top-N window (e.g. Kraken v2 `book`): without this, evicted levels
   * linger forever as phantom quotes.
   */
  truncate(): void {
    if (this.levels.size <= this.depth) return;
    const prices = [...this.levels.keys()].sort((a, b) =>
      this.side === "bid" ? b - a : a - b,
    );
    for (const price of prices.slice(this.depth)) this.levels.delete(price);
  }

  /** Sorted (bids desc, asks asc) and capped to `depth` levels. */
  toArray(): Level[] {
    const arr: Level[] = [];
    for (const [price, qty] of this.levels) arr.push({ price, qty });
    arr.sort((a, b) =>
      this.side === "bid" ? b.price - a.price : a.price - b.price,
    );
    return arr.length > this.depth ? arr.slice(0, this.depth) : arr;
  }

  get size(): number {
    return this.levels.size;
  }
}

export class LocalBook {
  readonly bids: BookSide;
  readonly asks: BookSide;

  constructor(depth: number) {
    this.bids = new BookSide("bid", depth);
    this.asks = new BookSide("ask", depth);
  }

  reset(): void {
    this.bids.clear();
    this.asks.clear();
  }

  /** Truncate both sides to their depth (see BookSide.truncate). */
  truncate(): void {
    this.bids.truncate();
    this.asks.truncate();
  }
}
