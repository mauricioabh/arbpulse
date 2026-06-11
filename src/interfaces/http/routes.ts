import { Router, type Request, type Response } from "express";
import type { ApplicationService } from "../../composition/application-service.js";
import type { SseHub } from "../sse/sse.js";
import {
  ConfigPatchSchema,
  DemoControlBodySchema,
  MaxTradeControlBodySchema,
  RecordControlBodySchema,
  ThresholdControlBodySchema,
} from "./schemas/requests.js";
import { parseBody } from "./validate.js";

export function createRouter(app: ApplicationService, sse: SseHub): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.json({ success: true, data: { status: "ok", ts: Date.now() } });
  });

  router.get("/state", (_req: Request, res: Response) => {
    res.json({ success: true, data: app.getSnapshot() });
  });

  router.get("/stream", (req: Request, res: Response) => {
    sse.handle(req, res);
  });

  router.get("/config", (_req: Request, res: Response) => {
    res.json({ success: true, data: app.getConfig() });
  });

  router.patch("/config", (req: Request, res: Response) => {
    const patch = parseBody(ConfigPatchSchema, req, res);
    if (patch === null) return;

    const error = app.patchConfig(patch);
    if (error) {
      res.status(400).json({ success: false, error });
      return;
    }
    res.json({ success: true, data: app.getConfig() });
  });

  router.post("/control/pause", (_req: Request, res: Response) => {
    app.pause();
    res.json({ success: true });
  });

  router.post("/control/resume", (_req: Request, res: Response) => {
    app.resume();
    res.json({ success: true });
  });

  router.post("/control/reset", (_req: Request, res: Response) => {
    app.reset();
    res.json({ success: true });
  });

  router.post("/control/demo", (req: Request, res: Response) => {
    const body = parseBody(DemoControlBodySchema, req, res);
    if (body === null) return;

    app.setDemoMode(body.enabled);
    res.json({ success: true, data: { demoMode: body.enabled } });
  });

  router.post("/control/record", (req: Request, res: Response) => {
    const body = parseBody(RecordControlBodySchema, req, res);
    if (body === null) return;

    app.setRecordFeed(body.enabled);
    res.json({ success: true, data: { recordFeed: body.enabled } });
  });

  router.post("/control/threshold", (req: Request, res: Response) => {
    const body = parseBody(ThresholdControlBodySchema, req, res);
    if (body === null) return;

    const error = app.setThreshold(body.pct);
    if (error) {
      res.status(400).json({ success: false, error });
      return;
    }
    res.json({ success: true, data: { minNetProfitPct: body.pct } });
  });

  router.post("/control/max-trade", (req: Request, res: Response) => {
    const body = parseBody(MaxTradeControlBodySchema, req, res);
    if (body === null) return;

    const error = app.setMaxTradeBtc(body.btc);
    if (error) {
      res.status(400).json({ success: false, error });
      return;
    }
    res.json({ success: true, data: { maxTradeBtc: body.btc } });
  });

  return router;
}
