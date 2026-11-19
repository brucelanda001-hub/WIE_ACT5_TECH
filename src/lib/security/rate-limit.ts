// Small in-memory sliding-window limiter (single-server demo). Swap for Redis when scaling to several servers.

type Bucket = { hits: number[] };
const g = globalThis as unknown as { __ednovaRate?: Map<string, Bucket> };
const buckets = (g.__ednovaRate ??= new Map<string, Bucket>());

export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(key: string, max: number, windowSec: number): RateResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    buckets.set(key, b);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.hits[0] + windowMs - now) / 1000)) };
  }
  b.hits.push(now);
  buckets.set(key, b);
  return { ok: true };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}
