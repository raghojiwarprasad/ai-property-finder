import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const r = await db.execute(sql`select 1 as ok`);
  return NextResponse.json({ ok: r.rows?.[0]?.ok === 1 || true, aiMode: process.env.ANTHROPIC_API_KEY ? "live" : "fixture" });
}
