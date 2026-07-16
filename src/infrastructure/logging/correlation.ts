import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface CorrelationContext {
  correlationId: string;
  exchange?: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelationContext(): CorrelationContext | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function runWithCorrelation<T>(
  context: CorrelationContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

export function newCorrelationId(prefix = "tick"): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export function bindRequestCorrelation(
  headerValue: string | string[] | undefined,
): CorrelationContext {
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const correlationId =
    typeof raw === "string" && raw.trim()
      ? raw.trim()
      : newCorrelationId("req");
  return { correlationId };
}
