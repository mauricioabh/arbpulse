import * as Sentry from "@sentry/node";
import { isTracingEnabled } from "./tracing.js";

const dsn = process.env.SENTRY_DSN?.trim();

export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    // Tracing/spans are gated by SENTRY_TRACING (default off) to stay within
    // the Sentry free-tier span quota during 24/7 operation. Error monitoring
    // is always on.
    ...(isTracingEnabled()
      ? { tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1 }
      : {}),
  });

  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
    );
  });

  process.on("uncaughtException", (error) => {
    Sentry.captureException(error);
  });
}

export { Sentry };
