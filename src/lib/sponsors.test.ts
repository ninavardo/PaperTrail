import { describe, expect, it } from "vitest";
import { openDb } from "@/db/client";
import { migrate } from "@/db/migrate";
import { activeSponsor, createSponsor } from "./sponsors";

const base = { name: "Example", text: "A line of copy.", url: "https://sponsor.example" };

async function memoryDb() {
  const { db, client } = openDb(":memory:");
  await migrate(client);
  return db;
}

describe("activeSponsor", () => {
  it("shows a sponsor from its start (inclusive) to its end (exclusive)", async () => {
    const db = await memoryDb();
    await createSponsor(db, { ...base, activeFrom: "2026-11-01T00:00:00Z", activeTo: "2026-12-01T00:00:00Z" });
    expect(await activeSponsor(db, new Date("2026-10-31T23:59:59Z"))).toBeNull();
    expect((await activeSponsor(db, new Date("2026-11-01T00:00:00Z")))?.name).toBe("Example");
    expect((await activeSponsor(db, new Date("2026-11-30T23:59:59Z")))?.name).toBe("Example");
    expect(await activeSponsor(db, new Date("2026-12-01T00:00:00Z"))).toBeNull();
  });

  it("fills the single slot with the earliest-starting active sponsor", async () => {
    const db = await memoryDb();
    await createSponsor(db, { ...base, name: "Later", activeFrom: "2026-11-10", activeTo: "2026-12-01" });
    await createSponsor(db, { ...base, name: "Earlier", activeFrom: "2026-11-01", activeTo: "2026-12-01" });
    expect((await activeSponsor(db, new Date("2026-11-15")))?.name).toBe("Earlier");
  });

  it("rejects non-https links and empty or inverted windows", async () => {
    const db = await memoryDb();
    await expect(
      createSponsor(db, { ...base, url: "http://sponsor.example", activeFrom: "2026-11-01", activeTo: "2026-12-01" }),
    ).rejects.toThrow();
    await expect(
      createSponsor(db, { ...base, activeFrom: "2026-12-01", activeTo: "2026-11-01" }),
    ).rejects.toThrow(/after activeFrom/);
  });
});
