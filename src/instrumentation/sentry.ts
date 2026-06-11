import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN?.trim();

export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
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
