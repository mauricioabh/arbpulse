import * as Sentry from "@sentry/node";
import { trace, type Span, type Tracer } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SentrySpanProcessor, SentryPropagator } from "@sentry/opentelemetry";

let tracer: Tracer | null = null;

/**
 * OpenTelemetry spans export to Sentry via @sentry/opentelemetry when SENTRY_DSN is set.
 * Without a DSN, spans are no-ops (safe for local dev and tests).
 */
export function initOpenTelemetry(): Tracer {
  if (tracer) return tracer;

  if (!process.env.SENTRY_DSN?.trim()) {
    tracer = trace.getTracer("arbpulse");
    return tracer;
  }

  const provider = new NodeTracerProvider({
    spanProcessors: [new SentrySpanProcessor()],
  });
  provider.register({
    propagator: new SentryPropagator(),
  });

  tracer = provider.getTracer("arbpulse");
  return tracer;
}

export function getTracer(): Tracer {
  return tracer ?? initOpenTelemetry();
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => T | Promise<T>,
): Promise<T> {
  const activeTracer = getTracer();
  return activeTracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      span.setStatus({ code: 2, message: String(err) });
      Sentry.captureException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
