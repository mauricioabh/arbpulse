import type { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { config } from "../../infrastructure/config/config.js";
import { setCachedSnapshot } from "../../infrastructure/cache/upstash.js";
import { createLogger } from "../../infrastructure/logging/logger.js";
import { withSpan } from "../../instrumentation/otel.js";
import type { ApplicationService } from "../../composition/application-service.js";

const log = createLogger("sse");

export class SseHub {
  private clients = new Set<Response>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly app: ApplicationService) {}

  start(): void {
    this.timer = setInterval(() => this.broadcast(), config.broadcastMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    for (const res of this.clients) res.end();
    this.clients.clear();
  }

  handle(req: Request, res: Response): void {
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write(`retry: 2000\n\n`);
      this.send(res, this.app.getSnapshot());
      this.clients.add(res);
      log.info(`client connected`, { clientCount: this.clients.size });

      req.on("close", () => {
        this.clients.delete(res);
      });

      res.on("error", (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error("sse client error", { error: error.message });
        Sentry.captureException(error, { tags: { component: "sse" } });
        this.clients.delete(res);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error("sse handle failed", { error: error.message });
      Sentry.captureException(error, { tags: { component: "sse" } });
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "SSE setup failed" });
      }
    }
  }

  private broadcast(): void {
    if (this.clients.size === 0) return;
    void withSpan(
      "sse.broadcast",
      { clientCount: this.clients.size },
      async () => {
        const snapshot = this.app.getSnapshot();
        void setCachedSnapshot(snapshot);
        for (const res of this.clients) {
          try {
            this.send(res, snapshot);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            log.warn("sse send failed", { error: error.message });
            Sentry.captureException(error, { tags: { component: "sse" } });
            this.clients.delete(res);
          }
        }
      },
    );
  }

  private send(res: Response, data: unknown): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
