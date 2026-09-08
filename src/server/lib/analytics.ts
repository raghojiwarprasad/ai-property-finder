import { getDb, schema } from "@/server/db";
import { newId, RELEASE_VERSION } from "./util";

/**
 * Product analytics (spec/09_MEASUREMENT_AND_LAUNCH.md). Only IDs, statuses and small
 * scalars are accepted; raw CV text, answers and tutor transcripts never pass through here.
 */
export async function track(
  name: string,
  learnerId: string | null,
  props: Record<string, string | number | boolean | null> = {},
  surface?: string,
): Promise<void> {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === "string" && v.length > 120) continue; // never free text
    safe[k] = v;
  }
  const db = await getDb();
  await db.insert(schema.analyticsEvents).values({ id: newId("evt"), learnerId, name, props: safe, surface: surface ?? null, releaseVersion: RELEASE_VERSION });
}

export async function audit(
  actorLearnerId: string | null,
  action: string,
  objectType: string,
  objectId: string | null,
  outcome: "allowed" | "denied",
): Promise<void> {
  const db = await getDb();
  await db.insert(schema.accessAudit).values({ id: newId("aud"), actorLearnerId, action, objectType, objectId, outcome });
}
