import {
  CircuitStateSchema,
  ExchangeIdSchema,
  FeedStatusSchema,
  OpportunityStatusSchema,
  z,
} from "./common.js";

export const BestQuoteSchema = z
  .object({
    exchange: ExchangeIdSchema,
    bid: z.number().nullable(),
    bidQty: z.number().nullable(),
    ask: z.number().nullable(),
    askQty: z.number().nullable(),
    recvTs: z.number().int().nullable(),
    status: FeedStatusSchema,
    ageMs: z.number().int().nullable(),
  })
  .strict()
  .openapi("BestQuote");

export const WalletSchema = z
  .object({
    exchange: ExchangeIdSchema,
    usdt: z.number(),
    btc: z.number(),
  })
  .strict()
  .openapi("Wallet");

export const OpportunitySchema = z
  .object({
    id: z.string(),
    ts: z.number().int(),
    buyExchange: ExchangeIdSchema,
    sellExchange: ExchangeIdSchema,
    topBuyAsk: z.number(),
    topSellBid: z.number(),
    volumeBtc: z.number(),
    buyVwap: z.number(),
    sellVwap: z.number(),
    grossSpread: z.number(),
    grossSpreadPct: z.number(),
    feeBuy: z.number(),
    feeSell: z.number(),
    netProfit: z.number(),
    netProfitPct: z.number(),
    status: OpportunityStatusSchema,
    reason: z.string(),
    demo: z.boolean(),
  })
  .strict()
  .openapi("Opportunity");

export const TradeSchema = z
  .object({
    id: z.string(),
    ts: z.number().int(),
    buyExchange: ExchangeIdSchema,
    sellExchange: ExchangeIdSchema,
    volumeBtc: z.number(),
    requestedBtc: z.number(),
    buyVwap: z.number(),
    sellVwap: z.number(),
    execBuyVwap: z.number(),
    execSellVwap: z.number(),
    feeBuy: z.number(),
    feeSell: z.number(),
    netProfit: z.number(),
    netProfitPct: z.number(),
    partial: z.boolean(),
    demo: z.boolean(),
  })
  .strict()
  .openapi("Trade");

export const RebalanceEventSchema = z
  .object({
    id: z.string(),
    ts: z.number().int(),
    fromExchange: ExchangeIdSchema,
    toExchange: ExchangeIdSchema,
    asset: z.enum(["BTC", "USDT"]),
    amount: z.number(),
    withdrawalFee: z.number(),
    reason: z.string(),
  })
  .strict()
  .openapi("RebalanceEvent");

export const PnlPointSchema = z
  .object({
    ts: z.number().int(),
    pnl: z.number(),
  })
  .strict()
  .openapi("PnlPoint");

export const EngineStatsSchema = z
  .object({
    uptimeMs: z.number().int(),
    ticksProcessed: z.number().int(),
    opportunitiesDetected: z.number().int(),
    tradesExecuted: z.number().int(),
    tradesRejected: z.number().int(),
    realizedPnl: z.number(),
    consecutiveLosses: z.number().int(),
    circuit: CircuitStateSchema,
    demoMode: z.boolean(),
    avgTickMs: z.number(),
  })
  .strict()
  .openapi("EngineStats");

const ActiveExchangesSchema = z.record(ExchangeIdSchema, z.boolean());

export const PublicConfigSchema = z
  .object({
    minNetProfitPct: z.number(),
    maxTradeBtc: z.number(),
    staleMs: z.number().int(),
    flickerConfirmMs: z.number().int(),
    latencyMs: z.number().int(),
    activeExchanges: ActiveExchangesSchema,
    defaults: z
      .object({
        minNetProfitPct: z.number(),
        maxTradeBtc: z.number(),
        flickerConfirmMs: z.number().int(),
        activeExchanges: ActiveExchangesSchema,
      })
      .strict(),
    takerFees: z.record(ExchangeIdSchema, z.number()),
    withdrawalFeesBtc: z.record(ExchangeIdSchema, z.number()),
  })
  .strict()
  .openapi("PublicConfig");

export const StateSnapshotSchema = z
  .object({
    ts: z.number().int(),
    quotes: z.array(BestQuoteSchema),
    wallets: z.array(WalletSchema),
    stats: EngineStatsSchema,
    recentOpportunities: z.array(OpportunitySchema),
    recentTrades: z.array(TradeSchema),
    rebalances: z.array(RebalanceEventSchema),
    pnlSeries: z.array(PnlPointSchema),
    config: PublicConfigSchema,
  })
  .strict()
  .openapi("StateSnapshot");

export const HealthDataSchema = z
  .object({
    status: z.literal("ok"),
    ts: z.number().int(),
  })
  .strict()
  .openapi("HealthData");
