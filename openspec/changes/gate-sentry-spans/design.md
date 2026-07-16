## Context

`src/instrumentation/otel.ts` builds a tracer that, when `SENTRY_DSN` is set, registers a `NodeTracerProvider` with `SentrySpanProcessor`/`SentryPropagator`, so every `withSpan(...)` call on the hot path creates and exports a span to Sentry. `src/instrumentation/sentry.ts` sets `tracesSampleRate` unconditionally. Running 24/7 on a VPS multiplies span volume against Sentry's free-tier quota (5M spans/month), while error events stay small. We want tracing to remain a debugging option but be off by default.

## Goals / Non-Goals

**Goals:**
- Add a single boolean env var (`SENTRY_TRACING`, default `false`) that turns span creation/export on or off.
- Default behavior emits zero spans and zero hot-path span allocation.
- Preserve error monitoring exactly as-is regardless of the flag.
- No dependency changes; no API/wire changes.

**Non-Goals:**
- Removing OpenTelemetry or the `withSpan` abstraction.
- Making `tracesSampleRate` itself env-configurable (kept as current 0.1 prod / 1 dev when enabled).
- Changing which operations are wrapped.

## Decisions

- **Boolean gate over sample-rate gate.** A boolean `SENTRY_TRACING` that makes the tracer a no-op avoids hot-path span allocation entirely when off (aligns with the "no unnecessary alloc on the hot path" convention). A `tracesSampleRate=0` approach would still register the provider and create spans that are dropped later — more overhead. Alternative considered and rejected.
- **Gate lives in `otel.ts` init.** `initOpenTelemetry()` returns the no-op `trace.getTracer("arbpulse")` unless both `SENTRY_DSN` and `SENTRY_TRACING` are truthy. This keeps `withSpan`'s signature and all call sites unchanged; its `catch` still calls `Sentry.captureException`, so errors are captured even with a no-op span.
- **Conditional `tracesSampleRate` in `sentry.ts`.** Only set `tracesSampleRate` when tracing is enabled; omit it otherwise so Sentry performance is fully off. A shared helper `isTracingEnabled()` reads the flag so both files agree.
- **Parsing.** Reuse the existing truthy convention (`"1"` or `"true"`, case-insensitive) used by `config.ts`'s `bool()` for consistency; implement locally in the instrumentation module since it initializes before `config` import.

## Risks / Trade-offs

- [Someone enables tracing in prod and hits the quota] → Documented in `.env.example`/README that it is off by default and why; enabling is an explicit opt-in.
- [Flag read in two files could drift] → Centralize in one `isTracingEnabled()` helper exported from the instrumentation layer.
- [No-op tracer still wraps hot path in a promise] → Accepted: `withSpan` remains async as today; the change only removes span export, matching prior behavior when `SENTRY_DSN` was unset.

## Migration Plan

- Deploy with `SENTRY_TRACING` unset → tracing off (safe default), errors still reported.
- To debug, set `SENTRY_TRACING=true` (with `SENTRY_DSN`) temporarily; unset to roll back. No data migration.
