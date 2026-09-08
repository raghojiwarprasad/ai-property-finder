import path from "node:path";
import fs from "node:fs";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgliteDatabase<typeof schema> | NodePgDatabase<typeof schema>;

type Holder = { db: Db | null; ready: Promise<Db> | null; close: (() => Promise<void>) | null };

const globalHolder = globalThis as unknown as { __learnAiDb?: Holder };
const holder: Holder = globalHolder.__learnAiDb ?? { db: null, ready: null, close: null };
globalHolder.__learnAiDb = holder;

const migrationsFolder = path.join(process.cwd(), "drizzle");

async function create(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    const db = drizzlePg({ client: pool, schema });
    await migratePg(db, { migrationsFolder });
    holder.close = () => pool.end();
    return db;
  }
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), "data", "pglite");
  let client: PGlite;
  if (dir === "memory://") {
    client = new PGlite();
  } else {
    fs.mkdirSync(dir, { recursive: true });
    client = new PGlite(dir);
  }
  const db = drizzlePglite({ client, schema });
  await migratePglite(db, { migrationsFolder });
  holder.close = () => client.close();
  return db;
}

/** Returns the process-wide database handle, running migrations on first use. */
export function getDb(): Promise<Db> {
  if (holder.db) return Promise.resolve(holder.db);
  if (!holder.ready) {
    holder.ready = create().then((db) => {
      holder.db = db;
      return db;
    }).catch((err) => {
      holder.ready = null;
      throw err;
    });
  }
  return holder.ready;
}

/** Test helper: discard the current database so the next call creates a fresh one. */
export async function resetDbForTests(): Promise<void> {
  if (holder.close) await holder.close();
  holder.db = null;
  holder.ready = null;
  holder.close = null;
}

export { schema };
