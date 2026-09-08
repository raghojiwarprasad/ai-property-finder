import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { clock, newId } from "@/server/lib/util";
import { track } from "@/server/lib/analytics";
import { deleteUploadsForLearner, listFacts, purgeExpiredRawUploads } from "./experience";
import { getCapability, getItem, getMilestone } from "@/content";

/**
 * Learner control, retention and deletion (PRD-10). Export is machine-readable plus readable
 * summaries; deletion covers every owned object type; the sweeper enforces retention.
 */

export async function exportAccount(learnerId: string): Promise<Record<string, unknown>> {
  const db = await getDb();
  const [job] = await db.insert(schema.jobs).values({ id: newId("job"), learnerId, kind: "export", status: "running", scope: { learnerId } }).returning();
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  const facts = await listFacts(learnerId);
  const goals = await db.select().from(schema.goalVersions).where(eq(schema.goalVersions.learnerId, learnerId));
  const attempts = await db.select().from(schema.attempts).where(eq(schema.attempts.learnerId, learnerId));
  const evaluations = await db.select().from(schema.evaluations).where(eq(schema.evaluations.learnerId, learnerId));
  const evidence = await db.select().from(schema.evidenceEvents).where(eq(schema.evidenceEvents.learnerId, learnerId));
  const projections = await db.select().from(schema.capabilityProjections).where(eq(schema.capabilityProjections.learnerId, learnerId));
  const artefacts = await db.select().from(schema.artefactVersions).where(eq(schema.artefactVersions.learnerId, learnerId));
  const revisions = await db.select().from(schema.pathRevisions).where(eq(schema.pathRevisions.learnerId, learnerId));
  const runs = await db.select().from(schema.practiceRuns).where(eq(schema.practiceRuns.learnerId, learnerId));
  const threads = await db.select().from(schema.tutorThreads).where(eq(schema.tutorThreads.learnerId, learnerId));
  const messages = threads.length ? await db.select().from(schema.tutorMessages).where(inArray(schema.tutorMessages.threadId, threads.map((t) => t.id))) : [];
  const shares = await db.select().from(schema.shareSnapshots).where(eq(schema.shareSnapshots.learnerId, learnerId));
  const out = {
    format: "learn-ai-export/1",
    exportedAt: clock.now().toISOString(),
    learner: { id: learner.id, kind: learner.kind, preferences: learner.preferences, createdAt: learner.createdAt },
    experienceContext: facts,
    goals: goals.map((g) => ({ id: g.id, version: g.version, status: g.status, originalText: g.originalText, interpretation: g.interpretation, destination: g.destination, targetCapabilityIds: g.targetCapabilityIds, coverage: g.coverage, createdAt: g.createdAt, activatedAt: g.activatedAt, archivedAt: g.archivedAt })),
    capabilities: projections.map((p) => ({ capabilityId: p.capabilityId, title: getCapability(p.capabilityId)?.title, state: p.state, reason: p.reason, supportingEvidenceIds: p.supportingEvidenceIds, demonstratedAt: p.demonstratedAt, reviewDueAt: p.reviewDueAt })),
    evidence: evidence.map((e) => ({ id: e.id, attemptId: e.attemptId, evaluationId: e.evaluationId, capabilityId: e.capabilityId, itemFamily: e.itemFamily, taskKind: e.taskKind, independent: e.independent, result: e.result, goalVersionId: e.goalVersionId, supersededBy: e.supersededBy, createdAt: e.createdAt })),
    attempts: attempts.map((a) => ({ id: a.id, itemId: a.itemId, itemTitle: getItem(a.itemId)?.title ?? null, itemVersion: a.itemVersion, rubricVersion: a.rubricVersion, submission: a.submission, assistance: a.assistance, assisted: a.assisted, createdAt: a.createdAt })),
    evaluations: evaluations.map((e) => ({ id: e.id, attemptId: e.attemptId, evaluator: e.evaluator, evaluatorVersion: e.evaluatorVersion, status: e.status, result: e.result, criteria: e.criteria, summary: e.summary, mainGap: e.mainGap, supersedesId: e.supersedesId, reason: e.reason, createdAt: e.createdAt })),
    work: artefacts.map((a) => ({ id: a.id, title: a.title, version: a.version, kind: a.kind, capabilityId: a.capabilityId, milestone: getMilestone(a.milestoneId)?.title ?? a.milestoneId, content: a.content, assisted: a.assisted, attemptId: a.attemptId, evaluationId: a.evaluationId, createdAt: a.createdAt })),
    pathRevisions: revisions.map((r) => ({ id: r.id, goalVersionId: r.goalVersionId, reasonCode: r.reasonCode, reasonText: r.reasonText, policyVersion: r.policyVersion, createdAt: r.createdAt })),
    practiceRuns: runs.map((r) => ({ id: r.id, practiceId: r.practiceId, scenarioKey: r.scenarioKey, configuration: r.configuration, trace: r.trace, outcome: r.outcome, createdAt: r.createdAt })),
    tutorMessages: messages.map((m) => ({ id: m.id, threadId: m.threadId, role: m.role, content: m.content, status: m.status, assistanceLevel: m.assistanceLevel, createdAt: m.createdAt })),
    shares: shares.map((s) => ({ id: s.id, kind: s.kind, publishedAt: s.publishedAt, revokedAt: s.revokedAt })),
    readableSummary: {
      goals: goals.map((g) => `${g.status}: “${g.originalText}” → ${g.interpretation}`),
      demonstrated: projections.filter((p) => p.state === "demonstrated" || p.state === "needs_review").map((p) => `${getCapability(p.capabilityId)?.title}: ${p.reason}`),
      work: artefacts.map((a) => `${a.title} v${a.version}${a.assisted ? " (assisted)" : ""}`),
    },
  };
  await db.update(schema.jobs).set({ status: "completed", completedAt: clock.now(), result: { counts: { attempts: attempts.length, work: artefacts.length, goals: goals.length } } }).where(eq(schema.jobs.id, job.id));
  await track("export_requested", learnerId, { jobId: job.id });
  return out;
}

/** Immediate access revocation plus a deletion job covering every owned object type (PRD-10 F04). */
export async function deleteAccount(learnerId: string, userId: string | null): Promise<{ jobId: string }> {
  const db = await getDb();
  const now = clock.now();
  const [job] = await db.insert(schema.jobs).values({ id: newId("job"), learnerId, kind: "deletion", status: "queued", scope: { learnerId, userId } }).returning();
  // Revoke access and share links immediately.
  await db.update(schema.learners).set({ deletedAt: now, tokenHash: null }).where(eq(schema.learners.id, learnerId));
  await db.update(schema.shareSnapshots).set({ revokedAt: now }).where(and(eq(schema.shareSnapshots.learnerId, learnerId), isNull(schema.shareSnapshots.revokedAt)));
  if (userId) {
    await db.update(schema.authSessions).set({ revokedAt: now }).where(eq(schema.authSessions.userId, userId));
    await db.update(schema.users).set({ deletedAt: now, email: `deleted:${userId}`, passwordHash: "deleted" }).where(eq(schema.users.id, userId));
  }
  await track("deletion_requested", learnerId, { jobId: job.id });
  await runDeletionJob(job.id);
  return { jobId: job.id };
}

/** Performs the deletion job: primary content removed now; the job record retains only counts. */
export async function runDeletionJob(jobId: string): Promise<void> {
  const db = await getDb();
  const job = (await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).limit(1))[0];
  if (!job || job.kind !== "deletion" || job.status === "completed") return;
  const learnerId = String(job.scope.learnerId);
  const userId = job.scope.userId ? String(job.scope.userId) : null;
  await db.update(schema.jobs).set({ status: "running", attempts: job.attempts + 1 }).where(eq(schema.jobs.id, jobId));
  try {
    const counts: Record<string, number> = {};
    const del = async (name: string, fn: () => Promise<unknown>) => { await fn(); counts[name] = (counts[name] ?? 0) + 1; };
    await del("uploads", () => deleteUploadsForLearner(learnerId));
    await del("profileFacts", () => db.delete(schema.profileFacts).where(eq(schema.profileFacts.learnerId, learnerId)));
    await del("manualContexts", () => db.delete(schema.manualContexts).where(eq(schema.manualContexts.learnerId, learnerId)));
    await del("goals", () => db.delete(schema.goalVersions).where(eq(schema.goalVersions.learnerId, learnerId)));
    await del("assignments", () => db.delete(schema.activityAssignments).where(eq(schema.activityAssignments.learnerId, learnerId)));
    await del("drafts", () => db.delete(schema.drafts).where(eq(schema.drafts.learnerId, learnerId)));
    await del("attempts", () => db.delete(schema.attempts).where(eq(schema.attempts.learnerId, learnerId)));
    await del("evaluations", () => db.delete(schema.evaluations).where(eq(schema.evaluations.learnerId, learnerId)));
    await del("evidence", () => db.delete(schema.evidenceEvents).where(eq(schema.evidenceEvents.learnerId, learnerId)));
    await del("projections", () => db.delete(schema.capabilityProjections).where(eq(schema.capabilityProjections.learnerId, learnerId)));
    await del("pathRevisions", () => db.delete(schema.pathRevisions).where(eq(schema.pathRevisions.learnerId, learnerId)));
    await del("assistance", () => db.delete(schema.assistanceEvents).where(eq(schema.assistanceEvents.learnerId, learnerId)));
    await del("artefacts", () => db.delete(schema.artefactVersions).where(eq(schema.artefactVersions.learnerId, learnerId)));
    await del("tutorMessages", () => db.delete(schema.tutorMessages).where(eq(schema.tutorMessages.learnerId, learnerId)));
    await del("tutorThreads", () => db.delete(schema.tutorThreads).where(eq(schema.tutorThreads.learnerId, learnerId)));
    await del("appeals", () => db.delete(schema.appeals).where(eq(schema.appeals.learnerId, learnerId)));
    await del("practiceRuns", () => db.delete(schema.practiceRuns).where(eq(schema.practiceRuns.learnerId, learnerId)));
    await del("shares", () => db.delete(schema.shareSnapshots).where(eq(schema.shareSnapshots.learnerId, learnerId)));
    await del("aiRequests", () => db.update(schema.aiRequests).set({ learnerId: null }).where(eq(schema.aiRequests.learnerId, learnerId)));
    await del("analytics", () => db.update(schema.analyticsEvents).set({ learnerId: null }).where(eq(schema.analyticsEvents.learnerId, learnerId)));
    await del("contentIssues", () => db.update(schema.contentIssues).set({ learnerId: null }).where(eq(schema.contentIssues.learnerId, learnerId)));
    if (userId) await del("authSessions", () => db.delete(schema.authSessions).where(eq(schema.authSessions.userId, userId)));
    await db.update(schema.learners).set({ preferences: { sessionMinutes: 20, personalExamples: false, exampleDomainOverride: null, reminders: false } }).where(eq(schema.learners.id, learnerId));
    await db.update(schema.jobs).set({ status: "completed", completedAt: clock.now(), result: { objectTypes: Object.keys(counts) }, learnerId: null }).where(eq(schema.jobs.id, jobId));
  } catch (err) {
    await db.update(schema.jobs).set({ status: "failed", lastError: String((err as Error).message).slice(0, 300) }).where(eq(schema.jobs.id, jobId));
    throw err;
  }
}

/** Retention sweeper (PRD-10 F03): raw uploads after 24h, unclaimed guests after 7 days, expired shares, retryable failed jobs. */
export async function retentionSweep(now = clock.now()): Promise<{ rawPurged: number; guestsExpired: number; jobsRetried: number }> {
  const db = await getDb();
  const rawPurged = await purgeExpiredRawUploads(now);
  const expired = await db.select().from(schema.learners).where(and(eq(schema.learners.kind, "guest"), isNull(schema.learners.deletedAt), isNull(schema.learners.claimedAt), lt(schema.learners.expiresAt, now)));
  let guestsExpired = 0;
  for (const g of expired) {
    await deleteAccount(g.id, null);
    guestsExpired += 1;
  }
  const failed = await db.select().from(schema.jobs).where(and(eq(schema.jobs.kind, "deletion"), eq(schema.jobs.status, "failed"), lt(schema.jobs.attempts, 5)));
  let jobsRetried = 0;
  for (const j of failed) {
    try { await runDeletionJob(j.id); jobsRetried += 1; } catch { /* recorded on the job */ }
  }
  await db.insert(schema.jobs).values({ id: newId("job"), kind: "retention_sweep", status: "completed", scope: {}, result: { rawPurged, guestsExpired, jobsRetried }, completedAt: now });
  return { rawPurged, guestsExpired, jobsRetried };
}
