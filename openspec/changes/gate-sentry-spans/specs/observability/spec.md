## ADDED Requirements

### Requirement: Error monitoring is always active

The system SHALL report runtime errors to Sentry whenever `SENTRY_DSN` is configured, independent of any tracing configuration. This includes REST, WebSocket feed, and SSE errors captured via `Sentry.captureException`, plus process-level `unhandledRejection` and `uncaughtException` handlers.

#### Scenario: Error captured with DSN set

- **WHEN** `SENTRY_DSN` is set and a handled error occurs on the WebSocket, REST, or SSE path
- **THEN** the error is sent to Sentry as an error event

#### Scenario: No DSN configured

- **WHEN** `SENTRY_DSN` is empty or unset
- **THEN** Sentry is not initialized and no events are sent, and the application continues running normally

### Requirement: Tracing spans are gated by an environment flag

The system SHALL only create and export OpenTelemetry spans when the `SENTRY_TRACING` environment variable is enabled AND `SENTRY_DSN` is set. The flag SHALL default to disabled so that continuous 24/7 operation emits zero spans by default.

#### Scenario: Tracing disabled by default

- **WHEN** `SENTRY_TRACING` is unset or falsy (default)
- **THEN** the tracer is a no-op, no spans are created on the hot path, and no spans are exported to Sentry

#### Scenario: Tracing enabled with DSN

- **WHEN** `SENTRY_TRACING` is truthy and `SENTRY_DSN` is set
- **THEN** hot-path spans (`ws.message`, `orderbook.process`, `arbitrage.evaluate`, `sse.broadcast`) are created and exported to Sentry, and `tracesSampleRate` is applied

#### Scenario: Tracing enabled without DSN

- **WHEN** `SENTRY_TRACING` is truthy but `SENTRY_DSN` is empty or unset
- **THEN** the tracer is a no-op and no spans are exported, since export requires a DSN

### Requirement: Error capture is preserved when tracing is disabled

The system SHALL continue to report exceptions thrown inside hot-path work wrappers to Sentry even when tracing is disabled, so disabling spans never reduces error visibility.

#### Scenario: Exception in hot-path wrapper with tracing off

- **WHEN** `SENTRY_TRACING` is disabled and code wrapped by the hot-path span helper throws
- **THEN** the exception is still captured and reported to Sentry (as an error), and re-thrown to preserve existing control flow
