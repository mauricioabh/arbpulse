/**
 * OpenAPI 3.0 document generated from Zod schemas via @asteasolutions/zod-to-openapi.
 * Served interactively at /api-docs through Scalar.
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import {
  ErrorEnvelopeSchema,
  SuccessEnvelopeNoDataSchema,
} from "./schemas/common.js";
import {
  ConfigPatchSchema,
  DemoControlBodySchema,
  MaxTradeControlBodySchema,
  RecordControlBodySchema,
  ThresholdControlBodySchema,
} from "./schemas/requests.js";
import {
  ConfigResponseSchema,
  DemoModeResponseSchema,
  HealthResponseSchema,
  MaxTradeResponseSchema,
  RecordFeedResponseSchema,
  StateResponseSchema,
  ThresholdResponseSchema,
} from "./schemas/responses.js";
import { StateSnapshotSchema } from "./schemas/domain.js";

const registry = new OpenAPIRegistry();

registry.register("ErrorEnvelope", ErrorEnvelopeSchema);
registry.register("SuccessEnvelopeNoData", SuccessEnvelopeNoDataSchema);
registry.register("StateSnapshot", StateSnapshotSchema);

const jsonError = {
  description: "Invalid request body or out-of-range value.",
  content: { "application/json": { schema: ErrorEnvelopeSchema } },
};

const jsonServerError = {
  description: "Unexpected server error.",
  content: { "application/json": { schema: ErrorEnvelopeSchema } },
};

registry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["Monitoring"],
  summary: "Health check",
  description:
    "Lightweight endpoint used by Fly.io (and any uptime monitor) to verify the server is alive.",
  operationId: "getHealth",
  responses: {
    200: {
      description: "Server is healthy.",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/state",
  tags: ["Monitoring"],
  summary: "Full state snapshot",
  description:
    "Returns the complete in-memory engine state as a single JSON document.",
  operationId: "getState",
  responses: {
    200: {
      description: "Current engine state.",
      content: { "application/json": { schema: StateResponseSchema } },
    },
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/stream",
  tags: ["Streaming"],
  summary: "SSE real-time feed",
  description:
    "Opens a persistent Server-Sent Events connection. Each event carries a JSON-encoded StateSnapshot.",
  operationId: "getStream",
  responses: {
    200: {
      description: "SSE stream opened.",
      content: {
        "text/event-stream": {
          schema: {
            type: "string",
            description: "Newline-delimited SSE events.",
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/config",
  tags: ["Configuration"],
  summary: "Get engine configuration",
  operationId: "getConfig",
  responses: {
    200: {
      description: "Current configuration.",
      content: { "application/json": { schema: ConfigResponseSchema } },
    },
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/config",
  tags: ["Configuration"],
  summary: "Update engine configuration",
  operationId: "patchConfig",
  request: {
    body: {
      content: { "application/json": { schema: ConfigPatchSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Updated configuration.",
      content: { "application/json": { schema: ConfigResponseSchema } },
    },
    400: jsonError,
    500: jsonServerError,
  },
});

function registerControlPost(
  path: string,
  operationId: string,
  summary: string,
  description: string,
): void {
  registry.registerPath({
    method: "post",
    path,
    tags: ["Control"],
    summary,
    description,
    operationId,
    responses: {
      200: {
        description: summary,
        content: {
          "application/json": { schema: SuccessEnvelopeNoDataSchema },
        },
      },
      500: jsonServerError,
    },
  });
}

registerControlPost(
  "/api/control/pause",
  "controlPause",
  "Pause the arbitrage engine",
  "Manually pauses the engine until resume is called.",
);
registerControlPost(
  "/api/control/resume",
  "controlResume",
  "Resume the arbitrage engine",
  "Resumes opportunity evaluation after pause or circuit-breaker trip.",
);
registerControlPost(
  "/api/control/reset",
  "controlReset",
  "Reset simulated state",
  "Resets wallets, trade history, and cumulative P&L.",
);

registry.registerPath({
  method: "post",
  path: "/api/control/demo",
  tags: ["Control"],
  summary: "Enable / disable demo feed",
  operationId: "controlDemo",
  request: {
    body: {
      content: { "application/json": { schema: DemoControlBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Demo mode updated.",
      content: { "application/json": { schema: DemoModeResponseSchema } },
    },
    400: jsonError,
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/control/record",
  tags: ["Control"],
  summary: "Enable / disable feed recording",
  operationId: "controlRecord",
  request: {
    body: {
      content: { "application/json": { schema: RecordControlBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Recording state updated.",
      content: { "application/json": { schema: RecordFeedResponseSchema } },
    },
    400: jsonError,
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/control/threshold",
  tags: ["Control"],
  summary: "Set minimum net profit threshold",
  operationId: "controlThreshold",
  request: {
    body: {
      content: { "application/json": { schema: ThresholdControlBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Threshold updated.",
      content: { "application/json": { schema: ThresholdResponseSchema } },
    },
    400: jsonError,
    500: jsonServerError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/control/max-trade",
  tags: ["Control"],
  summary: "Set maximum trade volume",
  operationId: "controlMaxTrade",
  request: {
    body: {
      content: { "application/json": { schema: MaxTradeControlBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Max trade volume updated.",
      content: { "application/json": { schema: MaxTradeResponseSchema } },
    },
    400: jsonError,
    500: jsonServerError,
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openapiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Arb Pulse API",
    version: "1.0.0",
    description:
      "Real-time BTC/USDT arbitrage detection and simulation engine. Simulated only — no real funds are committed.",
    contact: { name: "Arb Pulse" },
    license: { name: "MIT" },
  },
  servers: [{ url: "/", description: "Current host (Fly.io / local)" }],
  tags: [
    { name: "Monitoring", description: "Health and state inspection." },
    { name: "Streaming", description: "Server-Sent Events real-time feed." },
    {
      name: "Configuration",
      description: "Read and update engine parameters.",
    },
    { name: "Control", description: "Pause, resume, reset and mode switches." },
  ],
});
