import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";
import { isUpstashConfigured } from "../cache/upstash.js";

type RouteTier = "read" | "stream" | "write" | "health";

const LIMITS: Record<
  Exclude<RouteTier, "health">,
  { requests: number; window: `${number} s` | `${number} m` }
> = {
  read: { requests: 60, window: "1 m" },
  stream: { requests: 10, window: "1 m" },
  write: { requests: 30, window: "1 m" },
};

const limiters = new Map<Exclude<RouteTier, "health">, Ratelimit>();

function getLimiter(tier: Exclude<RouteTier, "health">): Ratelimit | null {
  if (!isUpstashConfigured()) {
    return null;
  }
  let limiter = limiters.get(tier);
  if (limiter) {
    return limiter;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
  const redis = new Redis({ url, token });
  const cfg = LIMITS[tier];
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
    prefix: `arbpulse:${tier}`,
  });
  limiters.set(tier, limiter);
  return limiter;
}

function clientKey(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function tierForPath(path: string, method: string): RouteTier {
  if (path === "/health") return "health";
  if (path === "/stream") return "stream";
  if (method === "GET" || method === "HEAD") return "read";
  return "write";
}

export function createRateLimitMiddleware() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const tier = tierForPath(req.path, req.method);
    if (tier === "health") {
      next();
      return;
    }

    const limiter = getLimiter(tier);
    if (!limiter) {
      next();
      return;
    }

    const { success, reset } = await limiter.limit(`${tier}:${clientKey(req)}`);
    if (success) {
      next();
      return;
    }

    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      success: false,
      error: "Too many requests",
    });
  };
}
