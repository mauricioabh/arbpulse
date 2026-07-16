## Why

Arb Pulse is moving to a 24/7 VPS (Hetzner), where the engine runs continuously and emits OpenTelemetry spans on the hot path (`ws.message` → `orderbook.process` → `arbitrage.evaluate` → `sse.broadcast`). At that volume the app can approach or exceed Sentry's free-tier span quota (5M spans/month), while error monitoring stays well within limits. We want to keep tracing available for debugging but off by default so continuous operation is free-tier safe.

## What Changes

- Introduce an environment variable (`SENTRY_TRACING`, boolean, default `false`) that gates OpenTelemetry span creation and export to Sentry.
- When `SENTRY_TRACING` is disabled (default), the tracer is a no-op: no spans are created or exported, and no hot-path span allocation occurs. Error capture (`Sentry.captureException`, `unhandledRejection`, `uncaughtException`) remains fully active.
- When `SENTRY_TRACING` is enabled **and** `SENTRY_DSN` is set, spans are created and exported to Sentry as today, and `tracesSampleRate` is applied.
- Document the new variable in `.env.example` and `README.md`.

## Capabilities

### New Capabilities
- `observability`: error monitoring and optional distributed tracing behavior — how Sentry error capture is always on, and how OpenTelemetry span emission is conditioned on an environment flag.

### Modified Capabilities
<!-- None: no existing specs under openspec/specs/. -->

## Impact

- Code: `src/instrumentation/otel.ts` (gate span provider/export), `src/instrumentation/sentry.ts` (conditional `tracesSampleRate`), possibly `src/instrumentation/index.ts`.
- Config/docs: `.env.example`, `README.md` (observability section + env var table).
- Dependencies: none added or removed (OTel packages stay for the enabled path).
- Behavior: default runtime emits zero spans; error monitoring unchanged. No API or wire-format changes.
