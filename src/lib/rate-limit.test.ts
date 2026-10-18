import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows up to the limit within a window, then refuses", () => {
    const rl = new RateLimiter(3, 60_000);
    expect([1, 2, 3].map(() => rl.hit("a", 0).allowed)).toEqual([true, true, true]);
    const fourth = rl.hit("a", 10);
    expect(fourth).toMatchObject({ allowed: false, remaining: 0, resetAt: 60_000 });
  });

  it("counts each key separately", () => {
    const rl = new RateLimiter(1, 60_000);
    expect(rl.hit("a", 0).allowed).toBe(true);
    expect(rl.hit("b", 0).allowed).toBe(true);
    expect(rl.hit("a", 0).allowed).toBe(false);
  });

  it("opens a new window once the old one ends", () => {
    const rl = new RateLimiter(1, 1_000);
    rl.hit("a", 0);
    expect(rl.hit("a", 999).allowed).toBe(false);
    expect(rl.hit("a", 1_000)).toMatchObject({ allowed: true, remaining: 0, resetAt: 2_000 });
  });
});
