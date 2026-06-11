import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(!process.env.CI && {
    webServer: {
      command: "npm start",
      url: "http://localhost:8080/api/health",
      reuseExistingServer: !process.env.PW_FRESH_SERVER,
      env: { DEMO_MODE: "true" },
    },
  }),
});
