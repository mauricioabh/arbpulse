import { successEnvelope, SuccessEnvelopeNoDataSchema } from "./common.js";
import {
  HealthDataSchema,
  PublicConfigSchema,
  StateSnapshotSchema,
} from "./domain.js";
import { z } from "./common.js";

export const HealthResponseSchema = successEnvelope(
  HealthDataSchema,
  "HealthResponse",
);
export const StateResponseSchema = successEnvelope(
  StateSnapshotSchema,
  "StateResponse",
);
export const ConfigResponseSchema = successEnvelope(
  PublicConfigSchema,
  "ConfigResponse",
);

export const DemoModeResponseSchema = successEnvelope(
  z.object({ demoMode: z.boolean() }).strict(),
  "DemoModeResponse",
);

export const RecordFeedResponseSchema = successEnvelope(
  z.object({ recordFeed: z.boolean() }).strict(),
  "RecordFeedResponse",
);

export const ThresholdResponseSchema = successEnvelope(
  z.object({ minNetProfitPct: z.number() }).strict(),
  "ThresholdResponse",
);

export const MaxTradeResponseSchema = successEnvelope(
  z.object({ maxTradeBtc: z.number() }).strict(),
  "MaxTradeResponse",
);

export { SuccessEnvelopeNoDataSchema };
