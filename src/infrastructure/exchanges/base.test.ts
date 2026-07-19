import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExchangeId, OrderBook } from "../../domain/entities/index.js";
import { ExchangeConnector } from "./base.js";

/** Minimal connector for exercising emit() without a real WebSocket. */
class TestConnector extends ExchangeConnector {
  readonly id: ExchangeId = "kraken";
  protected readonly url = "ws://unused";
  resyncCount = 0;

  constructor() {
    super(5);
  }

  protected subscribeMessage(): unknown {
    return {};
  }

  protected handleMessage(): void {}

  protected override resync(): void {
    this.resyncCount += 1;
    super.resync();
  }

  applyLevels(bids: [number, number][], asks: [number, number][]): void {
    for (const [price, qty] of bids) this.book.bids.apply(price, qty);
    for (const [price, qty] of asks) this.book.asks.apply(price, qty);
  }

  emitNow(): void {
    this.emit(null);
  }

  get bookSize(): number {
    return this.book.bids.size + this.book.asks.size;
  }
}

test("normal book is emitted to listeners", () => {
  const c = new TestConnector();
  const received: OrderBook[] = [];
  c.onBook((b) => received.push(b));

  c.applyLevels([[64560, 1]], [[64561, 1]]);
  c.emitNow();

  assert.equal(received.length, 1);
  assert.equal(received[0]?.bids[0]?.price, 64560);
  assert.equal(c.resyncCount, 0);
});

test("crossed book is not emitted and triggers resync", () => {
  const c = new TestConnector();
  const received: OrderBook[] = [];
  c.onBook((b) => received.push(b));

  // Phantom bid above the real ask: corrupted local book.
  c.applyLevels(
    [
      [64925.9, 0.15],
      [64560, 1],
    ],
    [[64561, 1]],
  );
  c.emitNow();

  assert.equal(received.length, 0, "corrupted book must not reach listeners");
  assert.equal(c.resyncCount, 1);
  assert.equal(c.bookSize, 0, "local book is reset for a fresh snapshot");
});
