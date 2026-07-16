/**
 * Single source of truth for the tracing gate. OpenTelemetry spans are only
 * created and exported to Sentry when `SENTRY_TRACING` is truthy (and a
 * `SENTRY_DSN` is set). Defaults to disabled so 24/7 operation stays off the
 * Sentry free-tier span quota. Error monitoring is unaffected by this flag.
 */
export function isTracingEnabled(): boolean {
  const raw = process.env.SENTRY_TRACING;
  if (raw === undefined) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}
