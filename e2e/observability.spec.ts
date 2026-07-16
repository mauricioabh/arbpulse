import { test, expect } from "@playwright/test";

/** Asserts the dev Sentry probe responds; does not verify ingest in sentry.io (see README). */
test("sentry dev probe returns ok", async ({ request }) => {
  const res = await request.get("/api/debug/sentry");
  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toMatchObject({ ok: true });
});
