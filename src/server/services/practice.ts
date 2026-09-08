import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { CriterionResult } from "@/server/db/schema";
import { clock, newId } from "@/server/lib/util";
import { invalid, notFound } from "@/server/lib/errors";
import { track } from "@/server/lib/analytics";
import { CONTENT_VERSION, getPractice, getRubric } from "@/content";
import type { PracticeTemplate } from "@/content/types";
import { applyRubric, DETERMINISTIC_VERSION } from "./grading";
import { completeAssignment, computeNextActivity, getAssignment, recomputeProjection } from "./learning";

/**
 * Deterministic simulations (PRD-08). A run computes a trace from the scenario data and the
 * learner's configuration. Every action in the trace is fictional; nothing contacts a real
 * service. Submitting a run with an explanation creates the assessed attempt.
 */

export type TraceEvent = { step: number; subject: string; action: string; outcome: string; flag: "ok" | "risk" | "blocked" | "info" };

export type RunResult = {
  runId: string;
  runNumber: number;
  scenarioKey: string;
  trace: TraceEvent[];
  outcome: { summary: string; criteria: CriterionResult[]; result: "pass" | "fail"; unsafeActions: number; heldRoutine: number };
};

export function publicPractice(p: PracticeTemplate) {
  return {
    id: p.id, version: p.version, capabilityId: p.capabilityId, family: p.family, kind: p.kind, title: p.title, simulates: p.simulates, objective: p.objective, brief: p.brief, hints: p.hints, controls: p.controls,
    scenarios: p.scenarios.map((s) => ({ key: s.key, title: s.title, description: s.description, data: publicScenarioData(p.kind, s.data) })),
  };
}

function publicScenarioData(kind: PracticeTemplate["kind"], data: Record<string, unknown>): Record<string, unknown> {
  if (kind === "approval_boundary") return { invoices: data.invoices };
  if (kind === "retrieval_explorer") {
    const passages = (data.passages as Array<Record<string, unknown>>).map((p) => ({ id: p.id, title: p.title, text: p.text }));
    return { question: data.question, passages };
  }
  return {};
}

export function simulate(p: PracticeTemplate, scenarioKey: string, configuration: Record<string, unknown>): RunResult["outcome"] & { trace: TraceEvent[] } {
  const scenario = p.scenarios.find((s) => s.key === scenarioKey);
  if (!scenario) throw invalid("Unknown scenario.");
  const rubric = getRubric(p.rubricId)!;
  if (p.kind === "approval_boundary") return simulateApproval(scenario.data, configuration, rubric.criteria);
  if (p.kind === "retrieval_explorer") return simulateRetrieval(scenario.data, configuration, rubric.criteria);
  throw invalid("This practice type is not available.");
}

type Invoice = { id: string; supplier: string; amount: number; newSupplier: boolean; matchConfidence: number; note: string };

function simulateApproval(data: Record<string, unknown>, cfg: Record<string, unknown>, criteria: { id: string; label: string; critical: boolean }[]) {
  const invoices = data.invoices as Invoice[];
  const mustReview = new Set(data.mustReview as string[]);
  const routine = new Set(data.routine as string[]);
  const duplicates = (data.duplicates as string[][] | undefined) ?? [];
  const limit = Number(cfg.autoPayLimit ?? 5000);
  const newAuto = Boolean(cfg.newSupplierAuto ?? true);
  const minConf = Number(cfg.minConfidence ?? 0.5);
  const unsure = String(cfg.unsureAction ?? "pay");
  const dupCheck = Boolean(cfg.duplicateCheck ?? false);
  const trace: TraceEvent[] = [];
  const seen = new Map<string, string>();
  let unsafe = 0;
  let heldRoutine = 0;
  let uncertaintyHandled = true;
  invoices.forEach((inv, i) => {
    const step = i + 1;
    const dupKey = `${inv.supplier}|${inv.amount}`;
    const isDup = duplicates.some((pair) => pair.includes(inv.id)) && seen.has(dupKey);
    seen.set(dupKey, inv.id);
    if (dupCheck && isDup) {
      trace.push({ step, subject: inv.id, action: "Duplicate check", outcome: `Matches ${seen.get(dupKey) === inv.id ? "an earlier invoice" : "an earlier invoice"} with the same supplier and amount. Held for a human. (simulated)`, flag: "blocked" });
      return;
    }
    const unsureNow = inv.matchConfidence < minConf;
    if (unsureNow) {
      if (unsure === "hold") {
        trace.push({ step, subject: inv.id, action: "Low matching confidence", outcome: `Confidence ${inv.matchConfidence} is below ${minConf}. Held for human review. (simulated)`, flag: "blocked" });
        if (routine.has(inv.id)) heldRoutine += 1;
        return;
      }
      if (unsure === "ask_supplier") {
        trace.push({ step, subject: inv.id, action: "Low matching confidence", outcome: `Confidence ${inv.matchConfidence} is below ${minConf}. A clarification email was simulated; payment waits. (no real email sent)`, flag: "info" });
        if (routine.has(inv.id)) heldRoutine += 1;
        return;
      }
      uncertaintyHandled = false;
    }
    const overLimit = inv.amount > limit;
    const blockedNew = inv.newSupplier && !newAuto;
    if (overLimit || blockedNew) {
      trace.push({ step, subject: inv.id, action: "Routed for approval", outcome: `${overLimit ? `Amount ${inv.amount} exceeds the automatic limit ${limit}.` : "New supplier requires approval."} Held for a human. (simulated)`, flag: "blocked" });
      if (routine.has(inv.id)) heldRoutine += 1;
      return;
    }
    const risky = mustReview.has(inv.id) || isDup;
    if (risky) unsafe += 1;
    trace.push({ step, subject: inv.id, action: "Paid automatically", outcome: `${inv.amount} paid to ${inv.supplier} without a human. ${risky ? `Note on file: ${inv.note} This should have reached a person.` : "Routine."} (simulated payment; no money moved)`, flag: risky ? "risk" : "ok" });
  });
  const uncertainty = unsure !== "pay" || minConf <= 0;
  const results: CriterionResult[] = criteria.map((c) => {
    const status =
      c.id === "A1" ? (unsafe === 0 ? "met" : "not_met") :
      c.id === "A2" ? (heldRoutine <= 1 ? "met" : "not_met") :
      c.id === "A3" ? (uncertainty && uncertaintyHandled ? "met" : "not_met") :
      c.id === "A4" ? (dupCheck ? "met" : "not_met") : "uncertain";
    return { id: c.id, label: c.label, critical: c.critical, status, span: null, note: c.id === "A1" && unsafe > 0 ? `${unsafe} invoice(s) that needed a person were paid automatically.` : c.id === "A2" && heldRoutine > 1 ? `${heldRoutine} routine invoices were held; the workflow would stall.` : null };
  });
  const result: "pass" | "fail" = applyRubric({ id: "RUB-approval-boundary", version: 1, criteria: criteria.map((c) => ({ ...c, cues: [], antiCues: [] })), supportingRequired: 1 }, results) === "pass" ? "pass" : "fail";
  const summary = unsafe > 0
    ? `${unsafe} payment${unsafe === 1 ? "" : "s"} went out that a person should have seen. Read the trace to find which control was missing.`
    : heldRoutine > 1 ? "Nothing risky was paid, but routine invoices were held too. A control that stops everything is not a control." : "No unusual payment left without a person, and routine invoices flowed. The boundary works for this day.";
  return { summary, criteria: results, result, unsafeActions: unsafe, heldRoutine, trace };
}

type Passage = { id: string; title: string; text: string; relevant: boolean; misleading?: boolean };

function simulateRetrieval(data: Record<string, unknown>, cfg: Record<string, unknown>, criteria: { id: string; label: string; critical: boolean }[]) {
  const passages = data.passages as Passage[];
  const answers = data.answers as Record<string, string>;
  const selected = new Set((cfg.passages as string[] | undefined) ?? []);
  const rule = String(cfg.unknownRule ?? "best_guess");
  const cite = Boolean(cfg.citeSources ?? false);
  const trace: TraceEvent[] = [];
  trace.push({ step: 1, subject: "Question", action: "Received", outcome: String(data.question), flag: "info" });
  const retrieved = passages.filter((p) => selected.has(p.id));
  retrieved.forEach((p, i) => trace.push({ step: i + 2, subject: p.id, action: "Retrieved", outcome: `${p.title}: “${p.text}” ${p.relevant ? "(answers the question)" : p.misleading ? "(about a different situation)" : "(unrelated)"}`, flag: p.relevant ? "ok" : p.misleading ? "risk" : "info" }));
  const hasRelevant = retrieved.some((p) => p.relevant);
  const hasMisleading = retrieved.some((p) => p.misleading);
  let answer: string;
  let flag: TraceEvent["flag"];
  if (hasRelevant) { answer = answers.withRelevant; flag = "ok"; }
  else if (hasMisleading && rule === "best_guess") { answer = answers.misleadingOnly; flag = "risk"; }
  else if (rule === "decline") { answer = answers.nothingRelevantDecline; flag = "blocked"; }
  else { answer = answers.nothingRelevantGuess; flag = "risk"; }
  if (!cite) answer = answer.replace(/\s*\(Source:[^)]*\)/, "");
  trace.push({ step: retrieved.length + 2, subject: "Answer", action: "Generated", outcome: `${answer} (fixture answer for this combination; no live model)`, flag });
  const results: CriterionResult[] = criteria.map((c) => {
    const status =
      c.id === "R1" ? (hasRelevant ? "met" : "not_met") :
      c.id === "R2" ? (rule === "decline" ? "met" : "not_met") :
      c.id === "R3" ? (cite ? "met" : "not_met") :
      c.id === "R4" ? (!hasMisleading || hasRelevant ? "met" : "not_met") : "uncertain";
    return { id: c.id, label: c.label, critical: c.critical, status, span: null, note: null };
  });
  const result: "pass" | "fail" = applyRubric({ id: "RUB-retrieval-explorer", version: 1, criteria: criteria.map((c) => ({ ...c, cues: [], antiCues: [] })), supportingRequired: 1 }, results) === "pass" ? "pass" : "fail";
  const summary = hasRelevant
    ? rule === "decline" ? "The relevant passage was supplied and the assistant is set to decline when passages are silent. The answer is supported." : "The answer is supported this time, but with “most likely answer” the assistant would guess when the passages are silent."
    : hasMisleading ? "The assistant answered from a passage about a different situation. The answer is fluent and wrong." : rule === "decline" ? "Nothing relevant was supplied, so the assistant said so. Honest, but not yet useful: include the passage that answers the question." : "Nothing relevant was supplied and the assistant guessed anyway.";
  return { summary, criteria: results, result, unsafeActions: flag === "risk" ? 1 : 0, heldRoutine: 0, trace };
}

export async function runPractice(learnerId: string, input: { practiceId: string; scenarioKey: string; configuration: Record<string, unknown>; assignmentId?: string | null }): Promise<RunResult> {
  const db = await getDb();
  const p = getPractice(input.practiceId);
  if (!p) throw notFound("Practice not found.");
  if (input.assignmentId) await getAssignment(learnerId, input.assignmentId);
  const cfg = sanitiseConfig(p, input.configuration);
  const outcome = simulate(p, input.scenarioKey, cfg);
  const prior = await db.select({ n: schema.practiceRuns.runNumber }).from(schema.practiceRuns).where(and(eq(schema.practiceRuns.learnerId, learnerId), eq(schema.practiceRuns.practiceId, p.id))).orderBy(desc(schema.practiceRuns.runNumber)).limit(1);
  const runNumber = (prior[0]?.n ?? 0) + 1;
  const { trace, ...rest } = outcome;
  const id = newId("run");
  await db.insert(schema.practiceRuns).values({ id, learnerId, assignmentId: input.assignmentId ?? null, practiceId: p.id, practiceVersion: p.version, scenarioKey: input.scenarioKey, configuration: cfg, trace, outcome: rest, runNumber });
  await track("practice_run", learnerId, { practiceId: p.id, runNumber, result: rest.result, scenario: input.scenarioKey });
  return { runId: id, runNumber, scenarioKey: input.scenarioKey, trace, outcome: rest };
}

function sanitiseConfig(p: PracticeTemplate, cfg: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of p.controls) {
    const v = cfg[c.id];
    if (c.type === "number") out[c.id] = Number.isFinite(Number(v)) ? Number(v) : c.default;
    else if (c.type === "toggle") out[c.id] = typeof v === "boolean" ? v : c.default;
    else if (c.type === "select") out[c.id] = c.options?.some((o) => o.value === v) ? v : c.default;
    else if (c.type === "multiselect") out[c.id] = Array.isArray(v) ? v.filter((x) => c.options?.some((o) => o.value === x)) : c.default;
    else out[c.id] = typeof v === "string" ? v.slice(0, 500) : c.default;
  }
  return out;
}

export async function listRuns(learnerId: string, practiceId: string) {
  const db = await getDb();
  return db.select().from(schema.practiceRuns).where(and(eq(schema.practiceRuns.learnerId, learnerId), eq(schema.practiceRuns.practiceId, practiceId))).orderBy(desc(schema.practiceRuns.runNumber));
}

/**
 * Submit a practice run as evidence. Requires an explanation of the decision (running the
 * default configuration alone proves nothing, PRD-08 F03). Assistance and scenario reuse follow the same rules as items.
 */
export async function submitPractice(learnerId: string, input: { assignmentId: string; runId: string; explanation: string; idempotencyKey: string }): Promise<{ attemptId: string; result: string; assisted: boolean; independent: boolean; summary: string; criteria: CriterionResult[]; next: { assignmentId: string | null; reasonCode: string; reasonText: string } | null; replayed: boolean }> {
  const db = await getDb();
  const existing = (await db.select().from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.idempotencyKey, input.idempotencyKey))).limit(1))[0];
  if (existing) {
    const ev = (await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, existing.id)).limit(1))[0];
    const evd = (await db.select().from(schema.evidenceEvents).where(eq(schema.evidenceEvents.attemptId, existing.id)).limit(1))[0];
    return { attemptId: existing.id, result: ev?.result ?? "pending", assisted: existing.assisted, independent: evd?.independent ?? false, summary: ev?.summary ?? "", criteria: ev?.criteria ?? [], next: null, replayed: true };
  }
  const assignment = await getAssignment(learnerId, input.assignmentId);
  const p = assignment.practiceId ? getPractice(assignment.practiceId) : null;
  if (!p) throw invalid("This activity is not a practice.");
  const run = (await db.select().from(schema.practiceRuns).where(eq(schema.practiceRuns.id, input.runId)).limit(1))[0];
  if (!run || run.learnerId !== learnerId || run.practiceId !== p.id) throw notFound("Run not found.");
  const explanation = input.explanation.trim();
  if (explanation.length < 30) throw invalid("Explain the decision behind your configuration in a sentence or two; running it alone is not evidence.");
  const rubric = getRubric(p.rubricId)!;
  const assistance = (await db.select().from(schema.assistanceEvents).where(and(eq(schema.assistanceEvents.learnerId, learnerId), eq(schema.assistanceEvents.assignmentId, assignment.id)))).map((a) => a.kind);
  const assisted = assistance.some((k) => ["worked_answer", "tutor_solution", "hint_2", "hint_3"].includes(k));
  const priorScenario = await db.select({ id: schema.attempts.id }).from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.itemFamily, `${p.family}:${run.scenarioKey}`)));
  const exposedRepeat = priorScenario.length > 0;
  const outcome = run.outcome as { summary: string; criteria: CriterionResult[]; result: "pass" | "fail" };
  const [attempt] = await db.insert(schema.attempts).values({
    id: newId("att"), learnerId, assignmentId: assignment.id, itemId: p.id, itemVersion: p.version, rubricId: rubric.id, rubricVersion: rubric.version, itemFamily: `${p.family}:${run.scenarioKey}`,
    capabilityId: p.capabilityId, depth: p.depth, kind: "simulation", submission: { runId: run.id, configuration: run.configuration, explanation }, assistance, assisted, idempotencyKey: input.idempotencyKey,
  }).returning();
  const [evaluation] = await db.insert(schema.evaluations).values({
    id: newId("evl"), attemptId: attempt.id, learnerId, rubricId: rubric.id, rubricVersion: rubric.version, evaluator: "deterministic", evaluatorVersion: DETERMINISTIC_VERSION, status: "final", result: outcome.result,
    criteria: outcome.criteria, summary: outcome.summary, mainGap: outcome.criteria.find((c) => c.critical && c.status !== "met")?.note ?? null, nextMove: outcome.result === "pass" ? "Try the second scenario without hints to confirm it transfers." : p.hints[0],
  }).returning();
  const independent = !assisted && !exposedRepeat;
  await db.insert(schema.evidenceEvents).values({ id: newId("evd"), learnerId, evaluationId: evaluation.id, attemptId: attempt.id, capabilityId: p.capabilityId, depth: p.depth, itemFamily: `${p.family}:${run.scenarioKey}`, taskKind: "simulation", independent, result: outcome.result, goalVersionId: assignment.goalVersionId });
  await db.insert(schema.artefactVersions).values({
    id: newId("art"), learnerId, artefactKey: p.id, version: run.runNumber, title: p.title, kind: "simulation", capabilityId: p.capabilityId, milestoneId: assignment.milestoneId, itemId: p.id, taskContext: p.objective,
    content: { scenario: run.scenarioKey, configuration: run.configuration, explanation, trace: run.trace }, attemptId: attempt.id, evaluationId: evaluation.id, assisted, isDraft: false, contentVersion: CONTENT_VERSION,
  });
  await recomputeProjection(learnerId, p.capabilityId);
  await completeAssignment(learnerId, assignment.id);
  const next = await computeNextActivity(learnerId);
  await track("practice_demonstrated", learnerId, { practiceId: p.id, result: outcome.result, independent });
  return { attemptId: attempt.id, result: outcome.result, assisted, independent, summary: outcome.summary, criteria: outcome.criteria, next: { assignmentId: next.assignment?.id ?? null, reasonCode: next.reasonCode, reasonText: next.reasonText }, replayed: false };
}

export { clock as practiceClock };
