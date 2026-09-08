import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { clock, hashToken, newId, newToken } from "@/server/lib/util";
import { forbidden, invalid, notFound } from "@/server/lib/errors";
import { audit, track } from "@/server/lib/analytics";
import { getCapability, getItem, getItemByFamily, publicItem } from "@/content";
import { gradeSelected } from "./grading";
import { getRubric } from "@/content";
import { listFacts } from "./experience";

/**
 * Useful sharing (PRD-11, R2). Snapshots are explicit, immutable, sanitised copies. Public
 * payloads never reference private records; employer names and profile facts are excluded.
 */

export type SharePreview = {
  kind: "challenge" | "work";
  title: string;
  publicPayload: Record<string, unknown>;
  excluded: string[];
  assisted: boolean;
};

const CHALLENGE_FAMILIES = ["quick_claim_check", "quick_certainty", "quick_brief_check", "quick_retrieval", "quick_fair_test", "quick_ab_limit", "quick_control", "quick_eval_case", "quick_task_risk", "quick_rubric", "quick_ai_ml_genai", "quick_claim_source", "quick_memo_gap", "quick_status_vs_correct"];

/** Challenge eligibility: only after an independent demonstration on the capability (G01). */
export async function eligibleChallenges(learnerId: string): Promise<Array<{ family: string; title: string; capabilityTitle: string }>> {
  const db = await getDb();
  const projections = await db.select().from(schema.capabilityProjections).where(eq(schema.capabilityProjections.learnerId, learnerId));
  const demonstrated = new Set(projections.filter((p) => p.state === "demonstrated" || p.state === "needs_review").map((p) => p.capabilityId));
  return CHALLENGE_FAMILIES.map((f) => getItemByFamily(f)).filter((i): i is NonNullable<typeof i> => Boolean(i) && demonstrated.has(i!.capabilityId)).map((i) => ({ family: i.family, title: i.title, capabilityTitle: getCapability(i.capabilityId)?.title ?? "" }));
}

/** Proper-noun runs inside fact values (e.g. an employer name), excluding the leading word. */
function properNounsIn(values: string[]): string[] {
  const out = new Set<string>();
  for (const v of values) {
    const words = v.split(/\s+/);
    let run: string[] = [];
    words.forEach((w, i) => {
      const clean = w.replace(/[^A-Za-z&'-]/g, "");
      if (i > 0 && /^[A-Z][A-Za-z&'-]+$/.test(clean) && !["I", "AI", "HTTP", "API", "APIs", "SQL", "CV", "MBA"].includes(clean)) run.push(clean);
      else { if (run.length > 0) out.add(run.join(" ")); run = []; }
    });
    if (run.length > 0) out.add(run.join(" "));
  }
  return Array.from(out);
}

function sanitiseText(text: string, facts: string[], employerLike: string[]): { text: string; removed: string[] } {
  let out = text;
  const removed: string[] = [];
  for (const f of [...facts, ...employerLike, ...properNounsIn(facts)]) {
    if (f.length < 4) continue;
    const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (re.test(out)) { out = out.replace(re, "[removed]"); removed.push(f); }
  }
  return { text: out, removed };
}

export async function previewShare(learnerId: string, input: { kind: "challenge"; family: string } | { kind: "work"; artefactId: string }): Promise<SharePreview> {
  const db = await getDb();
  if (input.kind === "challenge") {
    const item = getItemByFamily(input.family);
    if (!item || !CHALLENGE_FAMILIES.includes(item.family)) throw invalid("That challenge is not shareable.");
    const eligible = await eligibleChallenges(learnerId);
    if (!eligible.some((e) => e.family === item.family)) throw invalid("Demonstrate this capability first; then you can share its challenge.");
    const pub = publicItem(item);
    return { kind: "challenge", title: item.title, publicPayload: { itemId: item.id, family: item.family, title: item.title, objective: item.objective, supplied: item.supplied, prompt: pub.prompt, capabilityTitle: getCapability(item.capabilityId)?.title }, excluded: ["Your score", "Your CV facts", "Your learning history"], assisted: false };
  }
  const art = (await db.select().from(schema.artefactVersions).where(eq(schema.artefactVersions.id, input.artefactId)).limit(1))[0];
  if (!art || art.learnerId !== learnerId) {
    await audit(learnerId, "share", "artefact", input.artefactId, "denied");
    throw forbidden("That work is not yours.");
  }
  const facts = await listFacts(learnerId);
  const factValues = facts.map((f) => f.value);
  const employerLike = facts.filter((f) => f.factType === "domain" || f.factType === "role").map((f) => f.value);
  const excluded = new Set<string>(["CV facts", "Employer names", "Private scores", "Tutor transcript"]);
  const item = getItem(art.itemId);
  const content: Record<string, string> = {};
  for (const [k, v] of Object.entries(art.content)) {
    if (k === "trace" || k === "runId") continue;
    const s = sanitiseText(String(v ?? ""), factValues, employerLike);
    content[k] = s.text;
    for (const r of s.removed) excluded.add(`Personal detail: ${r}`);
  }
  return {
    kind: "work", title: art.title,
    publicPayload: { title: art.title, taskContext: item?.objective ?? art.taskContext, supplied: item?.supplied ?? [], fields: item && item.prompt.kind === "worksheet" ? item.prompt.fields.map((f) => ({ id: f.id, label: f.label })) : null, content, assisted: art.assisted, assessmentScope: "A reviewed learning task; not a professional qualification.", capabilityTitle: getCapability(art.capabilityId)?.title },
    excluded: Array.from(excluded), assisted: art.assisted,
  };
}

export async function publishShare(learnerId: string, input: ({ kind: "challenge"; family: string } | { kind: "work"; artefactId: string }) & { showName: boolean; displayName?: string }): Promise<{ shareId: string; token: string; url: string }> {
  const db = await getDb();
  const preview = await previewShare(learnerId, input);
  const token = newToken();
  const id = newId("shr");
  await db.insert(schema.shareSnapshots).values({
    id, learnerId, tokenHash: hashToken(token), kind: preview.kind, payload: preview.publicPayload, showName: input.showName, displayName: input.showName ? (input.displayName ?? "").slice(0, 60) || null : null,
    sourceArtefactId: input.kind === "work" ? input.artefactId : null,
  });
  await track("share_published", learnerId, { shareId: id, kind: preview.kind });
  return { shareId: id, token, url: `/share/${token}` };
}

export async function listShares(learnerId: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.shareSnapshots).where(eq(schema.shareSnapshots.learnerId, learnerId));
  return rows.map((r) => ({ id: r.id, kind: r.kind, title: String(r.payload.title ?? ""), publishedAt: r.publishedAt.toISOString(), revokedAt: r.revokedAt?.toISOString() ?? null, flaggedForReview: r.flaggedForReview }));
}

export async function revokeShare(learnerId: string, shareId: string): Promise<void> {
  const db = await getDb();
  const r = await db.update(schema.shareSnapshots).set({ revokedAt: clock.now() }).where(and(eq(schema.shareSnapshots.id, shareId), eq(schema.shareSnapshots.learnerId, learnerId), isNull(schema.shareSnapshots.revokedAt))).returning();
  if (r.length === 0) {
    await audit(learnerId, "revoke", "share", shareId, "denied");
    throw notFound("Share not found.");
  }
  await track("share_revoked", learnerId, { shareId });
}

/** Flag shares that included a now-removed fact (UC09). */
export async function flagSharesForFact(learnerId: string, value: string): Promise<number> {
  const db = await getDb();
  const rows = await db.select().from(schema.shareSnapshots).where(and(eq(schema.shareSnapshots.learnerId, learnerId), isNull(schema.shareSnapshots.revokedAt)));
  let n = 0;
  for (const r of rows) {
    if (JSON.stringify(r.payload).toLowerCase().includes(value.toLowerCase())) {
      await db.update(schema.shareSnapshots).set({ flaggedForReview: true }).where(eq(schema.shareSnapshots.id, r.id));
      n += 1;
    }
  }
  return n;
}

/** Public resolution: revoked or unknown tokens return the same neutral state. */
export async function resolveShare(token: string): Promise<{ state: "available"; kind: string; payload: Record<string, unknown>; displayName: string | null; id: string } | { state: "unavailable" }> {
  const db = await getDb();
  const r = (await db.select().from(schema.shareSnapshots).where(eq(schema.shareSnapshots.tokenHash, hashToken(token))).limit(1))[0];
  if (!r || r.revokedAt) return { state: "unavailable" };
  return { state: "available", kind: r.kind, payload: r.payload, displayName: r.showName ? r.displayName : null, id: r.id };
}

/** Recipient attempt on a shared challenge: feedback without any account (PRD-11 F05). */
export async function attemptSharedChallenge(token: string, visitorKey: string, optionId: string): Promise<{ result: "pass" | "fail"; feedback: string; nextMove: string }> {
  const db = await getDb();
  const share = await resolveShare(token);
  if (share.state !== "available" || share.kind !== "challenge") throw notFound("This challenge is not available.");
  const item = getItem(String(share.payload.itemId));
  if (!item || item.prompt.kind !== "selected") throw notFound("This challenge is not available.");
  const rubric = getRubric(item.rubricId)!;
  const outcome = gradeSelected(item, rubric, { optionId });
  await db.insert(schema.shareAttempts).values({ id: newId("sat"), shareId: share.id, visitorKey: visitorKey.slice(0, 80), submission: { optionId }, result: outcome.result });
  await track("shared_task_attempted", null, { shareId: share.id, result: outcome.result });
  return { result: outcome.result === "pass" ? "pass" : "fail", feedback: outcome.result === "pass" ? `${outcome.summary} ${item.key.workedAnswer}` : `${outcome.summary} ${outcome.mainGap ?? ""}`, nextMove: outcome.result === "pass" ? "Want this explained through your own experience? Start your own path." : outcome.nextMove };
}
