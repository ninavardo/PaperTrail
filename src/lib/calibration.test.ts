import { describe, expect, it } from "vitest";
import { brierScore, currentStreak, reliabilityBins } from "./calibration";

describe("brierScore", () => {
  it("returns null with no predictions", () => {
    expect(brierScore([])).toBeNull();
  });

  it("is 0 for certain, correct predictions", () => {
    expect(brierScore([{ confidence: 100, correct: true }])).toBe(0);
  });

  it("is 1 for certain, wrong predictions", () => {
    expect(brierScore([{ confidence: 100, correct: false }])).toBe(1);
  });

  it("is 0.25 for coin-toss confidence regardless of outcome", () => {
    expect(
      brierScore([
        { confidence: 50, correct: true },
        { confidence: 50, correct: false },
      ]),
    ).toBeCloseTo(0.25, 10);
  });

  it("averages squared error across predictions", () => {
    // (0.7 - 1)^2 = 0.09, (0.9 - 0)^2 = 0.81, (0.6 - 1)^2 = 0.16 → mean 1.06 / 3
    const score = brierScore([
      { confidence: 70, correct: true },
      { confidence: 90, correct: false },
      { confidence: 60, correct: true },
    ]);
    expect(score).toBeCloseTo(1.06 / 3, 10);
  });

  it("rewards calibration over confident error", () => {
    const humble = brierScore([{ confidence: 60, correct: false }])!;
    const brash = brierScore([{ confidence: 95, correct: false }])!;
    expect(humble).toBeLessThan(brash);
  });
});

describe("reliabilityBins", () => {
  it("reports accuracy and mean confidence per bin", () => {
    const bins = reliabilityBins([
      { confidence: 70, correct: true },
      { confidence: 75, correct: false },
      { confidence: 100, correct: true },
    ]);
    const seventies = bins.find((b) => b.lo === 70)!;
    expect(seventies.count).toBe(2);
    expect(seventies.meanConfidence).toBe(72.5);
    expect(seventies.accuracy).toBe(50);
    const nineties = bins.find((b) => b.lo === 90)!;
    expect(nineties).toMatchObject({ count: 1, accuracy: 100, meanConfidence: 100 });
  });

  it("leaves empty bins without values", () => {
    const fifties = reliabilityBins([]).find((b) => b.lo === 50)!;
    expect(fifties).toEqual({ lo: 50, hi: 59, count: 0, meanConfidence: null, accuracy: null });
  });

  it("places every confidence from 50 to 100 in exactly one bin", () => {
    for (let c = 50; c <= 100; c++) {
      const hits = reliabilityBins([{ confidence: c, correct: true }]).filter((b) => b.count === 1);
      expect(hits).toHaveLength(1);
    }
  });
});

describe("currentStreak", () => {
  const now = new Date("2026-10-18T15:00:00Z");
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

  it("counts consecutive days ending today", () => {
    expect(currentStreak([day("2026-10-16"), day("2026-10-17"), day("2026-10-18")], now)).toBe(3);
  });

  it("keeps yesterday's streak alive until today ends", () => {
    expect(currentStreak([day("2026-10-16"), day("2026-10-17")], now)).toBe(2);
  });

  it("breaks on a missed day", () => {
    expect(currentStreak([day("2026-10-14"), day("2026-10-16")], now)).toBe(0);
  });

  it("counts several guesses on one day once", () => {
    expect(currentStreak([day("2026-10-18"), day("2026-10-18")], now)).toBe(1);
  });
});
