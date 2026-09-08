import type { ItemFamily, Rubric } from "@/content/types";
import type { CriterionResult } from "@/server/db/schema";

/**
 * Deterministic grading (PRD-06 F04). Selected-response and worksheet-with-numeric-cues
 * items are graded exactly. Written work uses cue matching as the reviewed fallback
 * evaluator; when cues are inconclusive the result is provisional, never a pass.
 */

export type GradeOutcome = {
  result: "pass" | "fail" | "provisional";
  criteria: CriterionResult[];
  summary: string;
  mainGap: string | null;
  nextMove: string;
  misconceptionId: string | null;
  evaluatorVersion: string;
};

export const DETERMINISTIC_VERSION = "det-2026.09.1";

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function submissionText(item: ItemFamily, submission: Record<string, unknown>): string {
  if (item.prompt.kind === "worksheet") {
    return item.prompt.fields.map((f) => String(submission[f.id] ?? "")).join("\n");
  }
  if (item.prompt.kind === "written") return String(submission.text ?? "");
  return String(submission.optionId ?? "");
}

function findCue(text: string, cues: string[]): string | null {
  for (const cue of cues) {
    const c = normalise(cue);
    if (c && text.includes(c)) return cue;
  }
  return null;
}

/** Aggregates criterion results under the fixed rubric thresholds. */
export function applyRubric(rubric: Rubric, criteria: CriterionResult[]): "pass" | "fail" | "provisional" {
  const critical = criteria.filter((c) => c.critical);
  const supporting = criteria.filter((c) => !c.critical);
  if (critical.some((c) => c.status === "not_met")) return "fail";
  if (critical.some((c) => c.status === "uncertain")) return "provisional";
  const metSupporting = supporting.filter((c) => c.status === "met").length;
  if (metSupporting >= rubric.supportingRequired) return "pass";
  const uncertainSupporting = supporting.filter((c) => c.status === "uncertain").length;
  if (metSupporting + uncertainSupporting >= rubric.supportingRequired) return "provisional";
  return "fail";
}

export function gradeSelected(item: ItemFamily, rubric: Rubric, submission: Record<string, unknown>): GradeOutcome {
  if (item.prompt.kind !== "selected") throw new Error("not a selected item");
  const optionId = String(submission.optionId ?? "");
  const unsure = optionId === "unsure";
  const correct = new Set(item.key.correctOptionIds ?? []);
  const isCorrect = correct.has(optionId);
  const option = item.prompt.options.find((o) => o.id === optionId);
  const misconceptionId = !isCorrect && option?.misconceptionId ? option.misconceptionId : null;
  const criterion = rubric.criteria[0];
  const criteria: CriterionResult[] = [{
    id: criterion.id, label: criterion.label, critical: true,
    status: isCorrect ? "met" : "not_met", span: option?.text ?? (unsure ? "I'm not sure" : null), note: null,
  }];
  const correctText = item.prompt.options.filter((o) => correct.has(o.id)).map((o) => o.text).join(" / ");
  if (isCorrect) {
    return { result: "pass", criteria, summary: "Correct.", mainGap: null, nextMove: "Try the same idea in a new situation.", misconceptionId: null, evaluatorVersion: DETERMINISTIC_VERSION };
  }
  if (unsure) {
    return { result: "fail", criteria, summary: "You were not sure, and that is useful to know.", mainGap: `The answer was: ${correctText}.`, nextMove: item.hints[0], misconceptionId: null, evaluatorVersion: DETERMINISTIC_VERSION };
  }
  return {
    result: "fail", criteria, summary: "Not this one.",
    mainGap: misconceptionId && item.misconceptionFeedback[misconceptionId] ? item.misconceptionFeedback[misconceptionId] : `The supported answer was: ${correctText}.`,
    nextMove: item.hints[0], misconceptionId, evaluatorVersion: DETERMINISTIC_VERSION,
  };
}

/** Cue-based deterministic evaluation for written and worksheet items. */
export function gradeWrittenByCues(item: ItemFamily, rubric: Rubric, submission: Record<string, unknown>): GradeOutcome {
  const raw = submissionText(item, submission);
  const text = normalise(raw);
  const criteria: CriterionResult[] = rubric.criteria.map((c) => {
    const anti = findCue(text, c.antiCues);
    if (anti) return { id: c.id, label: c.label, critical: c.critical, status: "not_met", span: anti, note: "Contradicted by the answer." };
    const cue = findCue(text, c.cues);
    if (cue) return { id: c.id, label: c.label, critical: c.critical, status: "met", span: cue, note: null };
    return { id: c.id, label: c.label, critical: c.critical, status: c.cues.length === 0 ? "uncertain" : "not_met", span: null, note: null };
  });
  const injected = /ignore (the )?(rubric|instructions)|mark (this|me) (as )?(pass|complete|correct)/i.test(raw);
  if (injected) {
    for (const c of criteria) if (c.critical && c.status !== "not_met") { c.status = "not_met"; c.note = "The answer instructs the grader instead of doing the task."; }
  }
  const tooShort = item.prompt.kind === "written" && text.length < Math.max(20, item.prompt.minChars / 2);
  let result = applyRubric(rubric, criteria);
  // A cue-based evaluator cannot confirm a written pass with high confidence when the answer is very short;
  // the result stays provisional so the learner is told feedback needs review rather than being granted a pass.
  if (result === "pass" && tooShort) result = "provisional";

  const firstGap = criteria.find((c) => c.critical && c.status !== "met") ?? criteria.find((c) => c.status !== "met");
  let misconceptionId: string | null = null;
  for (const [mid, _text] of Object.entries(item.misconceptionFeedback)) {
    void _text;
    // A criterion contradicted via antiCue signals the misconception associated with the item, if any.
    if (criteria.some((c) => c.note === "Contradicted by the answer.")) { misconceptionId = mid; break; }
  }
  const summary =
    result === "pass" ? "Your answer meets the criteria." :
    result === "provisional" ? "Your work is saved. Feedback needs a closer look before it counts as evidence." :
    "Not yet. One part of the task is missing.";
  const mainGap = result === "pass" ? null : firstGap ? gapText(firstGap, item, misconceptionId) : null;
  const nextMove = result === "pass"
    ? "Next, use the same check in a different situation."
    : result === "provisional"
      ? "You can revise now or continue; this attempt will be reviewed."
      : item.hints[Math.min(1, item.hints.length - 1)] ?? item.hints[0];
  return { result, criteria, summary, mainGap, nextMove, misconceptionId, evaluatorVersion: DETERMINISTIC_VERSION };
}

function gapText(c: CriterionResult, item: ItemFamily, misconceptionId: string | null): string {
  if (misconceptionId && item.misconceptionFeedback[misconceptionId]) return item.misconceptionFeedback[misconceptionId];
  if (c.status === "not_met" && c.note) return `${c.label}: ${c.note}`;
  return `${c.label} was not found in your answer.`;
}

/** Validates model-produced criterion spans: a met criterion must quote text that exists in the submission (PRD-06 F04). */
export function validateSpans(criteria: CriterionResult[], submission: string): { ok: boolean; invalid: string[] } {
  const text = normalise(submission);
  const invalid: string[] = [];
  for (const c of criteria) {
    if (c.status === "met") {
      if (!c.span || !text.includes(normalise(c.span))) invalid.push(c.id);
    }
  }
  return { ok: invalid.length === 0, invalid };
}
