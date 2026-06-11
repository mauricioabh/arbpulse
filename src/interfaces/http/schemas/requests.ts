import { ExchangeIdSchema, z } from "./common.js";

const MIN_PROFIT_PCT = 0.0001;
const MAX_PROFIT_PCT = 0.01;
const MIN_TRADE_BTC = 0.01;
const MAX_TRADE_BTC = 1.0;
const MAX_FLICKER_MS = 500;

export const BooleanControlBodySchema = z
  .object({
    enabled: z.boolean(),
  })
  .strict()
  .openapi("BooleanControlBody");

export const DemoControlBodySchema =
  BooleanControlBodySchema.openapi("DemoControlBody");
export const RecordControlBodySchema =
  BooleanControlBodySchema.openapi("RecordControlBody");

export const ThresholdControlBodySchema = z
  .object({
    pct: z.number().finite().min(MIN_PROFIT_PCT).max(MAX_PROFIT_PCT),
  })
  .strict()
  .openapi("ThresholdControlBody");

export const MaxTradeControlBodySchema = z
  .object({
    btc: z.number().finite().min(MIN_TRADE_BTC).max(MAX_TRADE_BTC),
  })
  .strict()
  .openapi("MaxTradeControlBody");

export const ConfigPatchSchema = z
  .object({
    minNetProfitPct: z
      .number()
      .finite()
      .min(MIN_PROFIT_PCT)
      .max(MAX_PROFIT_PCT)
      .optional(),
    maxTradeBtc: z
      .number()
      .finite()
      .min(MIN_TRADE_BTC)
      .max(MAX_TRADE_BTC)
      .optional(),
    flickerConfirmMs: z.number().int().min(0).max(MAX_FLICKER_MS).optional(),
    activeExchanges: z.record(ExchangeIdSchema, z.boolean()).optional(),
  })
  .strict()
  .openapi("ConfigPatch");
