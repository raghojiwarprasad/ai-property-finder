import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { CriterionResult } from "@/server/db/schema";
import { clock, newId } from "@/server/lib/util";
import { forbidden, invalid, notFound } from "@/server/lib/errors";
import { audit, track } from "@/server/lib/analytics";
import { CONTENT_VERSION, getItem, getMilestone, getRubric } from "@/content";
import type { ItemFamily, Rubric } from "@/content/types";
import { GatewayError, gatewayMode, runTask } from "@/server/gateway";
import { applyRubric, DETERMINISTIC_VERSION, gradeSelected, gradeWrittenByCues, submissionText, validateSpans, type GradeOutcome } from "./grading";
import { advanceReview, completeAssignment, computeNextActivity, getAssignment, recomputeProjection, type NextActivity } from "./learning";

/**
 * Assessment service (PRD-06). Attempts are immutable and idempotent; evaluation is
 * deterministic where objective, otherwise structured and span-validated; evidence is
 * appended only for final results; projections and the next activity follow.
 */

export type SubmitResult = {
  attemptId: string;
  replayed: boolean;
  evaluation: { id: string; result: string; status: string; summary: string; mainGap: string | null; nextMove: string | null; criteria: CriterionResult[]; evaluator: string; provisionalReason: string | null };
  assisted: boolean;
  independentEvidence: boolean;
  capabilityState: string | null;
  next: { assignmentId: string | null; reasonCode: string; reasonText: string } | null;
  milestoneCompleted: string | null;
};

export async function submitAttempt(learnerId: string, input: {
  assignmentId: string; itemId: string; itemVersion: number; submission: Record<string, unknown>; idempotencyKey: string; confidence?: "sure" | "unsure" | null;
}): Promise<SubmitResult> {
  const db = await getDb();
  const idempotencyKey = String(input.idempotencyKey ?? "").slice(0, 120);
  if (!idempotencyKey) throw invalid("Missing idempotency key.");
  const existing = (await db.select().from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.idempotencyKey, idempotencyKey))).limit(1))[0];
  if (existing) return buildResult(learnerId, existing, true);

  const assignment = await getAssignment(learnerId, input.assignmentId);
  const item = getItem(input.itemId);
  if (!item) throw notFound("Task not found.");
  if (assignment.itemId !== item.id) throw invalid("That task is not part of this activity.");
  if (item.version !== input.itemVersion) throw invalid("This task was updated since you loaded it. Reload to get the current version.", { itemVersion: item.version });
  if (assignment.itemVersion !== item.version) throw invalid("This activity refers to an earlier version of the task. Reload to continue with the saved version.");
  const rubric = getRubric(item.rubricId);
  if (!rubric) throw invalid("The rubric for this task is missing.");
  validateSubmission(item, input.submission);

  const assistance = await db.select().from(schema.assistanceEvents).where(and(eq(schema.assistanceEvents.learnerId, learnerId), eq(schema.assistanceEvents.assignmentId, assignment.id)));
  const kinds = assistance.map((a) => a.kind);
  const assisted = kinds.includes("worked_answer") || kinds.includes("tutor_solution") || kinds.includes("hint_2") || kinds.includes("hint_3");
  const priorOnFamily = await db.select({ id: schema.attempts.id }).from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.itemFamily, item.family)));
  const exposedRepeat = priorOnFamily.length > 0; // same exposed question again: no new independent evidence (PRD-06 F05)

  const attemptId = newId("att");
  const now = clock.now();
  let attempt: typeof schema.attempts.$inferSelect;
  try {
    [attempt] = await db.insert(schema.attempts).values({
      id: attemptId, learnerId, assignmentId: assignment.id, itemId: item.id, itemVersion: item.version, rubricId: rubric.id, rubricVersion: rubric.version,
      itemFamily: item.family, capabilityId: item.capabilityId, depth: item.depth, kind: item.prompt.kind, submission: input.submission,
      assistance: kinds, assisted, confidence: input.confidence ?? null, idempotencyKey, createdAt: now,
    }).returning();
  } catch {
    const replay = (await db.select().from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.idempotencyKey, idempotencyKey))).limit(1))[0];
    if (replay) return buildResult(learnerId, replay, true);
    throw invalid("Could not save the attempt.");
  }
  await track("attempt_submitted", learnerId, { attemptId, itemFamily: item.family, capabilityId: item.capabilityId, assisted, kind: item.prompt.kind });

  const outcome = await evaluate(learnerId, item, rubric, input.submission, assisted);
  const evaluation = await saveEvaluation(learnerId, attempt, rubric, outcome);
  await saveArtefact(learnerId, assignment, item, attempt, evaluation, outcome);

  let independent = false;
  if (evaluation.status === "final") {
    const taskKind = assignment.activityType === "review" ? "review" : item.taskKind;
    independent = !assisted && !exposedRepeat && taskKind !== "review";
    await db.insert(schema.evidenceEvents).values({
      id: newId("evd"), learnerId, evaluationId: evaluation.id, attemptId: attempt.id, capabilityId: item.capabilityId, depth: item.depth, itemFamily: item.family,
      taskKind, independent, result: outcome.result === "pass" ? "pass" : "fail", goalVersionId: assignment.goalVersionId,
    });
    if (taskKind === "review") await advanceReview(learnerId, item.capabilityId, outcome.result === "pass");
  }
  const projection = await recomputeProjection(learnerId, item.capabilityId);
  // The assignment completes when the task produced a final result; a provisional result keeps it open for revision.
  let next: NextActivity | null = null;
  if (evaluation.status === "final") {
    await completeAssignment(learnerId, assignment.id);
    next = await computeNextActivity(learnerId);
  }
  const milestone = getMilestone(assignment.milestoneId);
  const milestoneCompleted = milestone && evaluation.status === "final" && (await milestoneComplete(learnerId, milestone.capabilityIds)) ? milestone.title : null;
  await track("evaluation_completed", learnerId, { attemptId, result: outcome.result, status: evaluation.status, evaluator: evaluation.evaluator, independent });
  return {
    attemptId: attempt.id, replayed: false,
    evaluation: { id: evaluation.id, result: evaluation.result, status: evaluation.status, summary: evaluation.summary, mainGap: evaluation.mainGap, nextMove: evaluation.nextMove, criteria: evaluation.criteria, evaluator: evaluation.evaluator, provisionalReason: evaluation.uncertainty },
    assisted, independentEvidence: independent, capabilityState: projection.state,
    next: next ? { assignmentId: next.assignment?.id ?? null, reasonCode: next.reasonCode, reasonText: next.reasonText } : null,
    milestoneCompleted,
  };
}

async function milestoneComplete(learnerId: string, capabilityIds: string[]): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select().from(schema.capabilityProjections).where(eq(schema.capabilityProjections.learnerId, learnerId));
  return capabilityIds.every((c) => ["demonstrated", "needs_review"].includes(rows.find((r) => r.capabilityId === c)?.state ?? ""));
}

function validateSubmission(item: ItemFamily, submission: Record<string, unknown>): void {
  if (!submission || typeof submission !== "object") throw invalid("Missing answer.");
  if (item.prompt.kind === "selected") {
    const id = String(submission.optionId ?? "");
    if (id !== "unsure" && !item.prompt.options.some((o) => o.id === id)) throw invalid("Choose one of the options.");
  } else if (item.prompt.kind === "written") {
    const text = String(submission.text ?? "").trim();
    if (text.length < 1) throw invalid("Write your answer before submitting.");
    if (text.length > 12_000) throw invalid("Your answer is too long.");
  } else {
    const filled = item.prompt.fields.filter((f) => String(submission[f.id] ?? "").trim().length > 0);
    if (filled.length === 0) throw invalid("Fill in at least one field before submitting.");
  }
}

async function evaluate(learnerId: string, item: ItemFamily, rubric: Rubric, submission: Record<string, unknown>, assisted: boolean): Promise<GradeOutcome & { evaluator: "deterministic" | "model" | "fixture"; uncertainty: string | null }> {
  if (item.prompt.kind === "selected") return { ...gradeSelected(item, rubric, submission), evaluator: "deterministic", uncertainty: null };
  const cueOutcome = gradeWrittenByCues(item, rubric, submission);
  if (gatewayMode() !== "live") {
    return { ...cueOutcome, evaluator: "deterministic", uncertainty: cueOutcome.result === "provisional" ? "The reviewed cue-based evaluator could not confirm every criterion. A closer review is needed before this counts." : null };
  }
  try {
    const text = submissionText(item, submission);
    const r = await runTask("evaluate_written", {
      task: item.objective, supplied: item.supplied, criteria: rubric.criteria.map((c) => ({ id: c.id, label: c.label, critical: c.critical })),
      workedAnswer: item.key.workedAnswer, acceptedAlternatives: item.key.acceptedAlternatives, criticalErrors: item.key.criticalErrors, submission: text, assisted,
    }, { learnerId });
    const criteria: CriterionResult[] = rubric.criteria.map((c) => {
      const m = r.output.criteria.find((x) => x.id === c.id);
      return { id: c.id, label: c.label, critical: c.critical, status: m?.status ?? "uncertain", span: m?.span ?? null, note: m?.note ?? null };
    });
    const spans = validateSpans(criteria, text);
    if (!spans.ok) {
      // Model claimed evidence that is not in the answer: downgrade those criteria and keep the result provisional (PRD-06 F04).
      for (const c of criteria) if (spans.invalid.includes(c.id)) { c.status = "uncertain"; c.note = "The evaluator cited text that is not in your answer; this criterion needs review."; }
    }
    let result = applyRubric(rubric, criteria);
    if (r.output.uncertainty === "high" && result === "pass") result = "provisional";
    if (r.output.criticalErrorsFound.length > 0 && result === "pass") result = "fail";
    // Cross-check: a deterministic anti-cue on a critical criterion overrides a model pass.
    if (result === "pass" && cueOutcome.criteria.some((c) => c.critical && c.note === "Contradicted by the answer.")) result = "provisional";
    return {
      result, criteria, evaluator: "model", evaluatorVersion: r.promptVersion,
      summary: result === "pass" ? "Your answer meets the criteria." : result === "provisional" ? "Your work is saved. Feedback needs a closer look before it counts as evidence." : "Not yet. One part of the task is missing.",
      mainGap: result === "pass" ? null : r.output.mainGap ?? cueOutcome.mainGap, nextMove: r.output.nextMove, misconceptionId: cueOutcome.misconceptionId,
      uncertainty: result === "provisional" ? (spans.ok ? "The evaluator was not confident enough to apply the rubric reliably." : "The evaluator's evidence did not match your answer.") : null,
    };
  } catch (err) {
    if (err instanceof GatewayError) {
      // Provider failure never converts into a pass: save the deterministic view as provisional unless it is a clear fail.
      const fallback = cueOutcome.result === "fail" ? cueOutcome : { ...cueOutcome, result: "provisional" as const, summary: "Your work is saved; feedback is still being prepared.", nextMove: "You can continue; this attempt will be reviewed." };
      return { ...fallback, evaluator: "deterministic", uncertainty: `The written evaluator was unavailable (${err.errorClass}). Your work is saved and will be reviewed.` };
    }
    throw err;
  }
}

async function saveEvaluation(learnerId: string, attempt: typeof schema.attempts.$inferSelect, rubric: Rubric, o: GradeOutcome & { evaluator: string; uncertainty: string | null }, supersedesId: string | null = null, reason: string | null = null) {
  const db = await getDb();
  const [row] = await db.insert(schema.evaluations).values({
    id: newId("evl"), attemptId: attempt.id, learnerId, rubricId: rubric.id, rubricVersion: rubric.version, evaluator: o.evaluator, evaluatorVersion: o.evaluatorVersion ?? DETERMINISTIC_VERSION,
    status: o.result === "provisional" ? "provisional" : "final", result: o.result === "provisional" ? "pending" : o.result, criteria: o.criteria, summary: o.summary, mainGap: o.mainGap, nextMove: o.nextMove,
    uncertainty: o.uncertainty, supersedesId, reason,
  }).returning();
  return row;
}

async function saveArtefact(learnerId: string, assignment: typeof schema.activityAssignments.$inferSelect, item: ItemFamily, attempt: typeof schema.attempts.$inferSelect, evaluation: typeof schema.evaluations.$inferSelect, o: GradeOutcome): Promise<void> {
  if (item.prompt.kind === "selected") return;
  const db = await getDb();
  const artefactKey = `${item.id}`;
  const prior = await db.select({ v: schema.artefactVersions.version }).from(schema.artefactVersions).where(and(eq(schema.artefactVersions.learnerId, learnerId), eq(schema.artefactVersions.artefactKey, artefactKey))).orderBy(desc(schema.artefactVersions.version)).limit(1);
  await db.insert(schema.artefactVersions).values({
    id: newId("art"), learnerId, artefactKey, version: (prior[0]?.v ?? 0) + 1, title: item.title, kind: item.prompt.kind === "worksheet" ? (item.taskKind === "artefact" ? "brief" : "worksheet") : "written",
    capabilityId: item.capabilityId, milestoneId: assignment.milestoneId, itemId: item.id, taskContext: item.objective, content: attempt.submission, attemptId: attempt.id, evaluationId: evaluation.id,
    assisted: attempt.assisted, isDraft: false, contentVersion: CONTENT_VERSION,
  });
  void o;
  await track("work_saved", learnerId, { itemId: item.id, assisted: attempt.assisted });
}

async function buildResult(learnerId: string, attempt: typeof schema.attempts.$inferSelect, replayed: boolean): Promise<SubmitResult> {
  const db = await getDb();
  const ev = (await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, attempt.id)).orderBy(desc(schema.evaluations.createdAt)).limit(1))[0];
  const proj = (await db.select().from(schema.capabilityProjections).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, attempt.capabilityId))).limit(1))[0];
  const evidence = (await db.select().from(schema.evidenceEvents).where(eq(schema.evidenceEvents.attemptId, attempt.id)).limit(1))[0];
  const next = await computeNextActivity(learnerId);
  return {
    attemptId: attempt.id, replayed,
    evaluation: ev ? { id: ev.id, result: ev.result, status: ev.status, summary: ev.summary, mainGap: ev.mainGap, nextMove: ev.nextMove, criteria: ev.criteria, evaluator: ev.evaluator, provisionalReason: ev.uncertainty } : { id: "", result: "pending", status: "provisional", summary: "Your work is saved; feedback is still being prepared.", mainGap: null, nextMove: null, criteria: [], evaluator: "none", provisionalReason: null },
    assisted: attempt.assisted, independentEvidence: evidence?.independent ?? false, capabilityState: proj?.state ?? null,
    next: { assignmentId: next.assignment?.id ?? null, reasonCode: next.reasonCode, reasonText: next.reasonText }, milestoneCompleted: null,
  };
}

export async function getAttempt(learnerId: string, attemptId: string) {
  const db = await getDb();
  const attempt = (await db.select().from(schema.attempts).where(eq(schema.attempts.id, attemptId)).limit(1))[0];
  if (!attempt || attempt.learnerId !== learnerId) {
    await audit(learnerId, "read", "attempt", attemptId, "denied");
    throw forbidden("That attempt is not yours.");
  }
  const evaluations = await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, attempt.id)).orderBy(desc(schema.evaluations.createdAt));
  const appeals = await db.select().from(schema.appeals).where(eq(schema.appeals.attemptId, attempt.id));
  const item = getItem(attempt.itemId);
  return { attempt, evaluations, appeals, item: item ? { id: item.id, title: item.title, objective: item.objective, prompt: item.prompt, supplied: item.supplied } : null };
}

/** Grade appeal: append-only re-evaluation, original preserved (PRD-06 F07). */
export async function appealAttempt(learnerId: string, attemptId: string, reason: string): Promise<{ appealId: string; status: string; note: string }> {
  const db = await getDb();
  const { attempt, evaluations } = await getAttempt(learnerId, attemptId);
  const original = evaluations[evaluations.length - 1];
  if (!original) throw invalid("No evaluation to appeal yet.");
  const text = reason.trim().slice(0, 2000);
  if (text.length < 5) throw invalid("Say briefly what you think was marked incorrectly.");
  const open = (await db.select().from(schema.appeals).where(and(eq(schema.appeals.attemptId, attemptId), eq(schema.appeals.status, "open"))).limit(1))[0];
  if (open) return { appealId: open.id, status: "open", note: "Your appeal is already open. The original grade is preserved and shown as provisional until review." };
  const appealId = newId("apl");
  await db.insert(schema.appeals).values({ id: appealId, learnerId, attemptId, originalEvaluationId: original.id, reason: text, status: "open" });
  // Mark the evidence provisional: it still shows, but the capability is recomputed with the latest evaluation status.
  await db.insert(schema.evaluations).values({
    id: newId("evl"), attemptId, learnerId, rubricId: original.rubricId, rubricVersion: original.rubricVersion, evaluator: "human", evaluatorVersion: "review-queue", status: "provisional", result: "pending",
    criteria: original.criteria, summary: "Under review after your challenge. The original grade is kept on record.", mainGap: original.mainGap, nextMove: "Continue learning; this grade will be revised if the review agrees with you.", uncertainty: "Appeal open.", supersedesId: original.id, reason: "appeal",
  });
  await track("grade_appealed", learnerId, { attemptId });
  return { appealId, status: "open", note: "Your challenge is recorded. The original attempt and grade are preserved; a review will append a revised evaluation if it agrees." };
}

/** Review-side resolution of an appeal (operations function; pilot uses a script or authorised route). */
export async function resolveAppeal(appealId: string, decision: "accepted" | "rejected", note: string): Promise<void> {
  const db = await getDb();
  const appeal = (await db.select().from(schema.appeals).where(eq(schema.appeals.id, appealId)).limit(1))[0];
  if (!appeal || appeal.status !== "open") throw notFound("Appeal not found or already resolved.");
  const attempt = (await db.select().from(schema.attempts).where(eq(schema.attempts.id, appeal.attemptId)).limit(1))[0]!;
  const original = (await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, appeal.originalEvaluationId)).limit(1))[0]!;
  const rubric = getRubric(attempt.rubricId)!;
  const criteria: CriterionResult[] = decision === "accepted" ? original.criteria.map((c) => ({ ...c, status: "met" as const, note: "Accepted on appeal." })) : original.criteria;
  const result = decision === "accepted" ? "pass" : (original.result === "pending" ? "fail" : (original.result as "pass" | "fail"));
  const [revised] = await db.insert(schema.evaluations).values({
    id: newId("evl"), attemptId: attempt.id, learnerId: attempt.learnerId, rubricId: rubric.id, rubricVersion: rubric.version, evaluator: "human", evaluatorVersion: "review-2026.09", status: "final", result,
    criteria, summary: decision === "accepted" ? "Revised on review: your reasoning met the criteria." : "Reviewed: the original grade stands.", mainGap: decision === "accepted" ? null : original.mainGap, nextMove: original.nextMove, uncertainty: null, supersedesId: original.id, reason: "appeal_resolution",
  }).returning();
  await db.update(schema.appeals).set({ status: decision, resolutionEvaluationId: revised.id, resolutionNote: note.slice(0, 1000), resolvedAt: clock.now() }).where(eq(schema.appeals.id, appealId));
  // Supersede the original evidence event and append the revised one; no duplicate attempt is created.
  const priorEvidence = await db.select().from(schema.evidenceEvents).where(eq(schema.evidenceEvents.attemptId, attempt.id));
  const [newEvidence] = await db.insert(schema.evidenceEvents).values({
    id: newId("evd"), learnerId: attempt.learnerId, evaluationId: revised.id, attemptId: attempt.id, capabilityId: attempt.capabilityId, depth: attempt.depth, itemFamily: attempt.itemFamily,
    taskKind: getItem(attempt.itemId)?.taskKind ?? "check", independent: !attempt.assisted, result, goalVersionId: priorEvidence[0]?.goalVersionId ?? null,
  }).returning();
  for (const e of priorEvidence) await db.update(schema.evidenceEvents).set({ supersededBy: newEvidence.id }).where(eq(schema.evidenceEvents.id, e.id));
  await recomputeProjection(attempt.learnerId, attempt.capabilityId);
  await track("evaluation_revised", attempt.learnerId, { attemptId: attempt.id, decision });
}
