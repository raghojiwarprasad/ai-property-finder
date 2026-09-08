import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { CriterionResult } from "@/server/db/schema";
import { forbidden } from "@/server/lib/errors";
import { audit, track } from "@/server/lib/analytics";
import { getCapability, getItem, getMilestone, getPractice } from "@/content";

/**
 * My work (PRD-09): saved artefacts with provenance, first-versus-latest comparison and
 * readable export. Drafts are labelled; nothing here awards capability.
 */

export type WorkItem = {
  id: string; artefactKey: string; version: number; title: string; kind: string; capabilityId: string; capabilityTitle: string; milestoneId: string; milestoneTitle: string;
  taskContext: string; assisted: boolean; isDraft: boolean; createdAt: string; feedbackStatus: "reviewed" | "pending" | "draft" | "revised"; result: string | null; versions: number;
};

export async function listWork(learnerId: string): Promise<WorkItem[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.artefactVersions).where(eq(schema.artefactVersions.learnerId, learnerId)).orderBy(desc(schema.artefactVersions.createdAt));
  const drafts = await db.select().from(schema.drafts).where(eq(schema.drafts.learnerId, learnerId));
  const latestByKey = new Map<string, typeof rows[number]>();
  const countByKey = new Map<string, number>();
  for (const r of rows) {
    countByKey.set(r.artefactKey, (countByKey.get(r.artefactKey) ?? 0) + 1);
    if (!latestByKey.has(r.artefactKey)) latestByKey.set(r.artefactKey, r);
  }
  const out: WorkItem[] = [];
  for (const r of latestByKey.values()) {
    const ev = r.evaluationId ? (await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, r.evaluationId)).limit(1))[0] : null;
    const latestEv = r.attemptId ? (await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, r.attemptId)).orderBy(desc(schema.evaluations.createdAt)).limit(1))[0] : null;
    const status: WorkItem["feedbackStatus"] = r.isDraft ? "draft" : latestEv && latestEv.id !== ev?.id ? "revised" : ev?.status === "final" ? "reviewed" : "pending";
    out.push(toWorkItem(r, status, (latestEv ?? ev)?.result ?? null, countByKey.get(r.artefactKey) ?? 1));
  }
  // Unsubmitted drafts appear as Draft entries with Resume.
  for (const d of drafts) {
    const item = getItem(d.itemId);
    if (!item || latestByKey.has(item.id)) continue;
    const text = Object.values(d.content).map(String).join(" ").trim();
    if (!text) continue;
    out.push({
      id: `draft:${d.assignmentId}`, artefactKey: item.id, version: 0, title: item.title, kind: "draft", capabilityId: item.capabilityId, capabilityTitle: getCapability(item.capabilityId)?.title ?? "",
      milestoneId: "", milestoneTitle: "", taskContext: item.objective, assisted: false, isDraft: true, createdAt: d.updatedAt.toISOString(), feedbackStatus: "draft", result: null, versions: 0,
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function toWorkItem(r: typeof schema.artefactVersions.$inferSelect, feedbackStatus: WorkItem["feedbackStatus"], result: string | null, versions: number): WorkItem {
  return {
    id: r.id, artefactKey: r.artefactKey, version: r.version, title: r.title, kind: r.kind, capabilityId: r.capabilityId, capabilityTitle: getCapability(r.capabilityId)?.title ?? r.capabilityId,
    milestoneId: r.milestoneId, milestoneTitle: getMilestone(r.milestoneId)?.title ?? "", taskContext: r.taskContext, assisted: r.assisted, isDraft: r.isDraft, createdAt: r.createdAt.toISOString(), feedbackStatus, result, versions,
  };
}

export type WorkDetail = {
  item: WorkItem;
  task: { objective: string; supplied: Array<{ label: string; text: string }>; prompt: unknown } | null;
  content: Record<string, unknown>;
  fields: Array<{ id: string; label: string }> | null;
  evaluation: { id: string; result: string; status: string; summary: string; mainGap: string | null; nextMove: string | null; criteria: CriterionResult[]; evaluator: string; createdAt: string } | null;
  evaluationHistory: Array<{ id: string; result: string; status: string; summary: string; reason: string | null; createdAt: string }>;
  assistance: string[];
  versions: Array<{ id: string; version: number; assisted: boolean; result: string | null; createdAt: string }>;
  comparison: { first: Record<string, unknown>; latest: Record<string, unknown>; improvements: string[]; firstAssisted: boolean; latestAssisted: boolean } | null;
  evidence: { capabilityState: string; reason: string; independent: boolean } | null;
  /** Attempt behind the latest version, used by the item detail page for "Challenge this grade". */
  attemptId: string | null;
};

export async function getWork(learnerId: string, artefactId: string): Promise<WorkDetail> {
  const db = await getDb();
  const r = (await db.select().from(schema.artefactVersions).where(eq(schema.artefactVersions.id, artefactId)).limit(1))[0];
  if (!r || r.learnerId !== learnerId) {
    await audit(learnerId, "read", "artefact", artefactId, "denied");
    throw forbidden("That work is not yours.");
  }
  const versions = await db.select().from(schema.artefactVersions).where(and(eq(schema.artefactVersions.learnerId, learnerId), eq(schema.artefactVersions.artefactKey, r.artefactKey))).orderBy(asc(schema.artefactVersions.version));
  const item = getItem(r.itemId);
  const practice = getPractice(r.itemId);
  const evals = r.attemptId ? await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, r.attemptId)).orderBy(desc(schema.evaluations.createdAt)) : [];
  const ev = evals[0] ?? null;
  const attempt = r.attemptId ? (await db.select().from(schema.attempts).where(eq(schema.attempts.id, r.attemptId)).limit(1))[0] : null;
  const evidence = r.attemptId ? (await db.select().from(schema.evidenceEvents).where(eq(schema.evidenceEvents.attemptId, r.attemptId)).limit(1))[0] : null;
  const proj = (await db.select().from(schema.capabilityProjections).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, r.capabilityId))).limit(1))[0];
  const versionViews = await Promise.all(versions.map(async (v) => {
    const e = v.evaluationId ? (await db.select({ result: schema.evaluations.result }).from(schema.evaluations).where(eq(schema.evaluations.id, v.evaluationId)).limit(1))[0] : null;
    return { id: v.id, version: v.version, assisted: v.assisted, result: e?.result ?? null, createdAt: v.createdAt.toISOString() };
  }));
  const first = versions[0];
  const latest = versions[versions.length - 1];
  const comparison = versions.length > 1 && first && latest ? { first: first.content, latest: latest.content, improvements: await improvementsBetween(first, latest), firstAssisted: first.assisted, latestAssisted: latest.assisted } : null;
  await track("evidence_detail_opened", learnerId, { artefactId });
  return {
    item: toWorkItem(r, r.isDraft ? "draft" : ev?.status === "final" ? "reviewed" : "pending", ev?.result ?? null, versions.length),
    task: item ? { objective: item.objective, supplied: item.supplied, prompt: item.prompt } : practice ? { objective: practice.objective, supplied: [], prompt: { kind: "simulation", question: practice.brief } } : null,
    content: r.content,
    fields: item && item.prompt.kind === "worksheet" ? item.prompt.fields.map((f) => ({ id: f.id, label: f.label })) : null,
    evaluation: ev ? { id: ev.id, result: ev.result, status: ev.status, summary: ev.summary, mainGap: ev.mainGap, nextMove: ev.nextMove, criteria: ev.criteria, evaluator: ev.evaluator, createdAt: ev.createdAt.toISOString() } : null,
    evaluationHistory: evals.map((e) => ({ id: e.id, result: e.result, status: e.status, summary: e.summary, reason: e.reason, createdAt: e.createdAt.toISOString() })),
    assistance: attempt?.assistance ?? [],
    versions: versionViews,
    comparison,
    evidence: proj ? { capabilityState: proj.state, reason: proj.reason, independent: evidence?.independent ?? false } : null,
    attemptId: r.attemptId ?? null,
  };
}

async function improvementsBetween(first: typeof schema.artefactVersions.$inferSelect, latest: typeof schema.artefactVersions.$inferSelect): Promise<string[]> {
  const db = await getDb();
  const firstEv = first.evaluationId ? (await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, first.evaluationId)).limit(1))[0] : null;
  const latestEv = latest.evaluationId ? (await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, latest.evaluationId)).limit(1))[0] : null;
  const out: string[] = [];
  if (firstEv && latestEv) {
    for (const c of latestEv.criteria) {
      const before = firstEv.criteria.find((x) => x.id === c.id);
      if (before && before.status !== "met" && c.status === "met") out.push(`Now meets: ${c.label}`);
      if (before && before.status === "met" && c.status !== "met") out.push(`No longer meets: ${c.label}`);
    }
  }
  const firstText = Object.values(first.content).map(String).join(" ");
  const latestText = Object.values(latest.content).map(String).join(" ");
  if (latestText.length > firstText.length * 1.3) out.push("The revised version is substantially longer.");
  if (out.length === 0) out.push("No criterion changed between the first and latest version.");
  return out;
}

/** Readable Markdown export of one piece of work (PRD-09 F04). Nothing is published. */
export async function exportWorkMarkdown(learnerId: string, artefactId: string): Promise<string> {
  const d = await getWork(learnerId, artefactId);
  const lines: string[] = [];
  lines.push(`# ${d.item.title}`);
  lines.push("");
  lines.push(`Capability: ${d.item.capabilityTitle}  `);
  lines.push(`Milestone: ${d.item.milestoneTitle}  `);
  lines.push(`Version: ${d.item.version}  `);
  lines.push(`Assistance used: ${d.item.assisted ? "yes (worked answer or tutor solution)" : "none recorded"}  `);
  lines.push(`Saved: ${d.item.createdAt}`);
  lines.push("");
  lines.push("## Task");
  lines.push(d.task?.objective ?? d.item.taskContext);
  if (d.task?.supplied?.length) {
    lines.push("");
    for (const s of d.task.supplied) lines.push(`- **${s.label}:** ${s.text}`);
  }
  lines.push("");
  lines.push("## Your work");
  if (d.fields) for (const f of d.fields) { lines.push(`### ${f.label}`); lines.push(String(d.content[f.id] ?? "")); lines.push(""); }
  else if (typeof d.content.text === "string") lines.push(String(d.content.text));
  else lines.push("```json\n" + JSON.stringify(d.content, null, 2) + "\n```");
  if (d.evaluation) {
    lines.push("");
    lines.push("## Feedback");
    lines.push(`Result: ${d.evaluation.result} (${d.evaluation.status}); evaluator: ${d.evaluation.evaluator}`);
    lines.push(d.evaluation.summary);
    if (d.evaluation.mainGap) lines.push(`Main gap: ${d.evaluation.mainGap}`);
    for (const c of d.evaluation.criteria) lines.push(`- ${c.status === "met" ? "✓" : c.status === "uncertain" ? "?" : "✗"} ${c.label}${c.critical ? " (critical)" : ""}`);
  }
  lines.push("");
  lines.push("_Exported from Learn AI. This records a reviewed learning task and its conditions; it is not a professional qualification._");
  await track("work_exported", learnerId, { artefactId });
  return lines.join("\n");
}
