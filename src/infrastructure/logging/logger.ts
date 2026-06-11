import pino from "pino";
import { getCorrelationContext } from "./correlation.js";

const root = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "arbpulse" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, singleLine: true },
        },
      }
    : {}),
});

export function createLogger(scope: string) {
  const child = root.child({ scope });
  return {
    info: (msg: string, extra?: Record<string, unknown>) =>
      child.info({ ...bindings(), ...extra }, msg),
    warn: (msg: string, extra?: Record<string, unknown>) =>
      child.warn({ ...bindings(), ...extra }, msg),
    error: (msg: string, extra?: Record<string, unknown>) =>
      child.error({ ...bindings(), ...extra }, msg),
  };
}

function bindings(): Record<string, unknown> {
  const ctx = getCorrelationContext();
  if (!ctx) return {};
  return {
    correlationId: ctx.correlationId,
    ...(ctx.exchange ? { exchange: ctx.exchange } : {}),
  };
}

export type Logger = ReturnType<typeof createLogger>;
