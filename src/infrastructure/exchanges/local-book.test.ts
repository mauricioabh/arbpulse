import { test } from "node:test";
import assert from "node:assert/strict";
import { BookSide, LocalBook } from "./local-book.js";

test("truncate removes worst bid levels beyond depth", () => {
  const bids = new BookSide("bid", 3);
  for (const price of [100, 101, 102]) bids.apply(price, 1);
  // A better bid arrives; Kraken sends no delete for the evicted 100.
  bids.apply(103, 1);
  bids.truncate();

  assert.equal(bids.size, 3);
  assert.deepEqual(
    bids.toArray().map((l) => l.price),
    [103, 102, 101],
  );
});

test("truncate removes worst ask levels beyond depth", () => {
  const asks = new BookSide("ask", 3);
  for (const price of [100, 101, 102]) asks.apply(price, 1);
  asks.apply(99, 1);
  asks.truncate();

  assert.equal(asks.size, 3);
  assert.deepEqual(
    asks.toArray().map((l) => l.price),
    [99, 100, 101],
  );
});

test("truncate is a no-op when size <= depth", () => {
  const bids = new BookSide("bid", 5);
  bids.apply(100, 1);
  bids.apply(101, 2);
  bids.truncate();

  assert.equal(bids.size, 2);
  assert.deepEqual(
    bids.toArray().map((l) => l.price),
    [101, 100],
  );
});

test("phantom high bid disappears across a rally-then-drop (Kraken window)", () => {
  const depth = 3;
  const book = new LocalBook(depth);

  // Snapshot during a rally.
  book.bids.apply(64920, 1);
  book.bids.apply(64921, 1);
  book.bids.apply(64922, 1);
  book.truncate();

  // Higher bids push the low ones out of Kraken's top-3 window. Kraken sends
  // NO delete for the evicted 64920/64921 — only the client-side truncate
  // removes them. Without it they linger as phantoms.
  book.bids.apply(64924, 1);
  book.bids.apply(64925.9, 0.15);
  book.truncate();

  // Market drops: in-window levels get explicit qty-0 deletes and lower bids
  // enter the window.
  book.bids.apply(64925.9, 0);
  book.bids.apply(64924, 0);
  book.bids.apply(64922, 0);
  book.bids.apply(64564, 1);
  book.bids.apply(64563, 1);
  book.bids.apply(64562, 1);
  book.truncate();

  const top = book.bids.toArray();
  assert.equal(top.length, depth);
  assert.deepEqual(
    top.map((l) => l.price),
    [64564, 64563, 64562],
  );
  assert.ok(
    top.every((l) => l.price < 64900),
    "no phantom bid survives",
  );
});
