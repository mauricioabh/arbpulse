import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express, { Router } from "express";
import { isUpstashConfigured } from "../../infrastructure/cache/upstash.js";
import { loadEnvLocal } from "../../test-support/load-env-local.js";
import { createRateLimitMiddleware } from "./rate-limit.js";

loadEnvLocal();

const READ_LIMIT_PER_MIN = 60;

test(
  "read tier returns 429 with Retry-After after limit",
  { skip: !isUpstashConfigured() },
  async () => {
    const app = express();
    const router = Router();
    router.use(createRateLimitMiddleware());
    router.get("/state", (_req, res) => {
      res.json({ success: true, data: { ok: true } });
    });
    app.use("/api", router);

    const server = await new Promise<ReturnType<typeof app.listen>>(
      (resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
      },
    );
    const port = (server.address() as AddressInfo).port;
    const url = `http://127.0.0.1:${port}/api/state`;
    const clientIp = `rate-limit-qa-${randomUUID()}`;

    try {
      for (let i = 0; i < READ_LIMIT_PER_MIN; i++) {
        const res = await fetch(url, {
          headers: { "x-forwarded-for": clientIp },
        });
        assert.equal(res.status, 200, `request ${i + 1} should pass`);
      }

      const blocked = await fetch(url, {
        headers: { "x-forwarded-for": clientIp },
      });
      assert.equal(blocked.status, 429);
      assert.ok(blocked.headers.get("retry-after"));
      const body = (await blocked.json()) as { error?: string };
      assert.equal(body.error, "Too many requests");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  },
);

test("reports whether Upstash REST credentials are set", () => {
  assert.equal(typeof isUpstashConfigured(), "boolean");
});
