import { initOpenTelemetry } from "./otel.js";
import { initSentry } from "./sentry.js";

export function initInstrumentation(): void {
  initSentry();
  initOpenTelemetry();
}
