import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export { z };

export const ExchangeIdSchema = z
  .enum(["kraken", "bybit", "okx", "binance"])
  .openapi("ExchangeId");

export const FeedStatusSchema = z
  .enum(["connecting", "live", "stale", "down"])
  .openapi("FeedStatus");

export const CircuitStateSchema = z
  .enum(["running", "paused", "tripped"])
  .openapi("CircuitState");

export const OpportunityStatusSchema = z
  .enum([
    "executed",
    "executed_partial",
    "rejected_fees",
    "rejected_liquidity",
    "rejected_risk",
    "rejected_flicker",
    "rejected_stale",
    "pending_confirm",
  ])
  .openapi("OpportunityStatus");

export const ErrorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
  })
  .strict()
  .openapi("ErrorEnvelope");

export const SuccessEnvelopeNoDataSchema = z
  .object({
    success: z.literal(true),
  })
  .strict()
  .openapi("SuccessEnvelopeNoData");

export function successEnvelope<T extends z.ZodType>(
  dataSchema: T,
  name: string,
) {
  return z
    .object({
      success: z.literal(true),
      data: dataSchema,
    })
    .strict()
    .openapi(name);
}
