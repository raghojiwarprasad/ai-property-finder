import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, resetDbForTests, schema } from "@/server/db";

process.env.PGLITE_DIR = "memory://";

describe("db", () => {
  beforeAll(async () => { await resetDbForTests(); });
  afterAll(async () => { await resetDbForTests(); });
  it("migrates and inserts", async () => {
    const db = await getDb();
    await db.insert(schema.learners).values({ id: "l1", kind: "guest" });
    const rows = await db.select().from(schema.learners);
    expect(rows).toHaveLength(1);
    expect(rows[0].preferences.sessionMinutes).toBe(20);
  });
});
