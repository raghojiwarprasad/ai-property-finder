import { rateLimited } from "./errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-process rate limiter for public and expensive endpoints (PRD-14 F03).
 * Sufficient for a single-process pilot; replace with a shared store for multi-instance deployments.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) throw rateLimited();
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
