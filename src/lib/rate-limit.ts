export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; resetAt: number };

/** Fixed-window counter per key, held in process memory. */
export class RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();
  private lastSweep = 0;

  constructor(
    readonly limit: number,
    readonly windowMs: number,
  ) {}

  hit(key: string, now: number = Date.now()): RateLimitResult {
    this.sweep(now);
    let w = this.windows.get(key);
    if (!w || w.resetAt <= now) {
      w = { count: 0, resetAt: now + this.windowMs };
      this.windows.set(key, w);
    }
    w.count += 1;
    return {
      allowed: w.count <= this.limit,
      limit: this.limit,
      remaining: Math.max(0, this.limit - w.count),
      resetAt: w.resetAt,
    };
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    for (const [key, w] of this.windows) if (w.resetAt <= now) this.windows.delete(key);
  }
}
