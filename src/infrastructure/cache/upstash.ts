import { Redis } from "@upstash/redis";

const SNAPSHOT_KEY = "arbpulse:snapshot";
const SNAPSHOT_TTL_SEC = 1;

let redis: Redis | null | undefined;

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getRedis(): Redis | null {
  if (redis !== undefined) {
    return redis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

export async function getCachedSnapshot<T>(): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return (await client.get<T>(SNAPSHOT_KEY)) ?? null;
  } catch (err) {
    console.warn("[upstash] get snapshot failed", err);
    return null;
  }
}

export async function setCachedSnapshot<T>(snapshot: T): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(SNAPSHOT_KEY, snapshot, { ex: SNAPSHOT_TTL_SEC });
  } catch (err) {
    console.warn("[upstash] set snapshot failed", err);
  }
}
