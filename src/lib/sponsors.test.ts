import { describe, expect, it } from "vitest";
import { openDb } from "@/db/client";
import { activeSponsor, createSponsor } from "./sponsors";

const base = { name: "Example", text: "A line of copy.", url: "https://sponsor.example" };

describe("activeSponsor", () => {
  it("shows a sponsor from its start (inclusive) to its end (exclusive)", () => {
    const { db } = openDb(":memory:");
    createSponsor(db, { ...base, activeFrom: "2026-11-01T00:00:00Z", activeTo: "2026-12-01T00:00:00Z" });
    expect(activeSponsor(db, new Date("2026-10-31T23:59:59Z"))).toBeNull();
    expect(activeSponsor(db, new Date("2026-11-01T00:00:00Z"))?.name).toBe("Example");
    expect(activeSponsor(db, new Date("2026-11-30T23:59:59Z"))?.name).toBe("Example");
    expect(activeSponsor(db, new Date("2026-12-01T00:00:00Z"))).toBeNull();
  });

  it("fills the single slot with the earliest-starting active sponsor", () => {
    const { db } = openDb(":memory:");
    createSponsor(db, { ...base, name: "Later", activeFrom: "2026-11-10", activeTo: "2026-12-01" });
    createSponsor(db, { ...base, name: "Earlier", activeFrom: "2026-11-01", activeTo: "2026-12-01" });
    expect(activeSponsor(db, new Date("2026-11-15"))?.name).toBe("Earlier");
  });

  it("rejects non-https links and empty or inverted windows", () => {
    const { db } = openDb(":memory:");
    expect(() => createSponsor(db, { ...base, url: "http://sponsor.example", activeFrom: "2026-11-01", activeTo: "2026-12-01" })).toThrow();
    expect(() => createSponsor(db, { ...base, activeFrom: "2026-12-01", activeTo: "2026-11-01" })).toThrow(/after activeFrom/);
  });
});
