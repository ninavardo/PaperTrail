import { describe, expect, it } from "vitest";
import { INTERVALS, isDue, schedule, type Attempt } from "./spaced-repetition";

const at = (iso: string, correct: boolean): Attempt => ({ at: new Date(iso), correct });
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("schedule", () => {
  it("uses the 1, 3, 7, 21 day intervals", () => {
    expect(INTERVALS).toEqual([1, 3, 7, 21]);
  });

  it("does nothing for facts that were never missed", () => {
    expect(schedule([])).toEqual({ state: "none" });
    expect(schedule([at("2026-01-01T10:00:00Z", true)])).toEqual({ state: "none" });
  });

  it("schedules a missed fact for the next day", () => {
    expect(schedule([at("2026-01-01T23:30:00Z", false)])).toEqual({
      state: "learning",
      stage: 0,
      dueAt: day("2026-01-02"),
    });
  });

  it("walks 1, 3, 7 and 21 days through correct reviews, then graduates", () => {
    const history = [at("2026-01-01T09:00:00Z", false)];
    expect(schedule(history)).toMatchObject({ stage: 0, dueAt: day("2026-01-02") });

    history.push(at("2026-01-02T09:00:00Z", true));
    expect(schedule(history)).toMatchObject({ stage: 1, dueAt: day("2026-01-05") });

    history.push(at("2026-01-05T09:00:00Z", true));
    expect(schedule(history)).toMatchObject({ stage: 2, dueAt: day("2026-01-12") });

    history.push(at("2026-01-12T09:00:00Z", true));
    expect(schedule(history)).toMatchObject({ stage: 3, dueAt: day("2026-02-02") });

    history.push(at("2026-02-02T09:00:00Z", true));
    expect(schedule(history)).toEqual({ state: "graduated" });
  });

  it("restarts at one day after a miss at any stage", () => {
    const s = schedule([
      at("2026-01-01T09:00:00Z", false),
      at("2026-01-02T09:00:00Z", true),
      at("2026-01-05T09:00:00Z", true),
      at("2026-01-12T09:00:00Z", false),
    ]);
    expect(s).toEqual({ state: "learning", stage: 0, dueAt: day("2026-01-13") });
  });

  it("brings a graduated fact back if it is missed again", () => {
    const s = schedule([
      at("2026-01-01T09:00:00Z", false),
      at("2026-01-02T09:00:00Z", true),
      at("2026-01-05T09:00:00Z", true),
      at("2026-01-12T09:00:00Z", true),
      at("2026-02-02T09:00:00Z", true),
      at("2026-06-01T09:00:00Z", false),
    ]);
    expect(s).toEqual({ state: "learning", stage: 0, dueAt: day("2026-06-02") });
  });

  it("ignores input order", () => {
    const ordered = [at("2026-01-01T09:00:00Z", false), at("2026-01-02T09:00:00Z", true)];
    expect(schedule([...ordered].reverse())).toEqual(schedule(ordered));
  });
});

describe("isDue", () => {
  const s = schedule([at("2026-01-01T09:00:00Z", false)]);

  it("is not due before the scheduled day", () => {
    expect(isDue(s, new Date("2026-01-01T23:59:59Z"))).toBe(false);
  });

  it("is due from the start of the scheduled day", () => {
    expect(isDue(s, new Date("2026-01-02T00:00:00Z"))).toBe(true);
    expect(isDue(s, new Date("2026-01-09T00:00:00Z"))).toBe(true);
  });

  it("is never due for graduated or unmissed facts", () => {
    expect(isDue({ state: "graduated" }, new Date())).toBe(false);
    expect(isDue({ state: "none" }, new Date())).toBe(false);
  });
});
