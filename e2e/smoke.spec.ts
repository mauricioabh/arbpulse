import { test, expect } from "@playwright/test";

test("dashboard loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /ArbPulse/i })).toBeVisible();
});

test("SSE stream connects and delivers engine state", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.getByText("Connecting to engine…")).toBeHidden({
    timeout: 45_000,
  });
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(page.getByText("RUNNING")).toBeVisible();
  await expect(page.getByText("Realized P&L")).toBeVisible();
});
