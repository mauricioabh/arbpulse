## 1. Tracing gate

- [x] 1.1 Add `isTracingEnabled()` helper (reads `SENTRY_TRACING`, truthy = `"1"`/`"true"` case-insensitive) exported from the instrumentation layer
- [x] 1.2 In `src/instrumentation/otel.ts`, return the no-op tracer unless both `SENTRY_DSN` and `SENTRY_TRACING` are truthy (keep `withSpan` signature and its `Sentry.captureException` in catch)
- [x] 1.3 In `src/instrumentation/sentry.ts`, only set `tracesSampleRate` when tracing is enabled (omit it otherwise)

## 2. Documentation

- [x] 2.1 Add `SENTRY_TRACING` (default `false`) to `.env.example` with a note it gates spans for free-tier safety
- [x] 2.2 Update the README observability section to describe the flag and default-off behavior

## 3. Verification

- [x] 3.1 `npm run typecheck` passes
- [x] 3.2 `npm test` passes
- [x] 3.3 Manually confirm: with `SENTRY_TRACING` unset, no spans are emitted; error capture path unaffected
