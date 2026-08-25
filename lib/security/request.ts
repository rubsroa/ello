import "server-only";
import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export function clientAddress(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || "unknown";
}

export function hashIdentifier(value: string) {
  const pepper = process.env.AUTH_SECRET ?? "development-only-pepper";
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
      while (buckets.size >= MAX_BUCKETS) {
        const oldest = buckets.keys().next().value as string | undefined;
        if (!oldest) break;
        buckets.delete(oldest);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { remaining: limit - 1, resetAt: now + windowMs };
  }
  existing.count += 1;
  if (existing.count > limit) throw new RateLimitError(existing.resetAt);
  return { remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
  if (origin !== expected) throw new RequestOriginError();
}

export class RateLimitError extends Error {
  constructor(public readonly resetAt: number) { super("Trop de requêtes"); }
}

export class RequestOriginError extends Error {
  constructor() { super("Origine de requête refusée"); }
}
