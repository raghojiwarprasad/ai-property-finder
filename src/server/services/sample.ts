import { getItemByFamily, getLessonForCapability, publicItem } from "@/content";
import { gradeSelected, gradeWrittenByCues } from "./grading";
import { getRubric } from "@/content";

/**
 * "Try an example": an explicitly fictional learner and a short real interaction (S01
 * secondary action). No profile is created; nothing is persisted.
 */
export const SAMPLE_LEARNER = {
  name: "Example learner",
  label: "Fictional learner",
  context: "Coordinated suppliers and compared bids for construction projects.",
  goal: "Use AI confidently in operations work",
};

export function getSampleLesson() {
  const lesson = getLessonForCapability("F04")!;
  const bridge = lesson.bridges.find((b) => b.domain === "supplier_comparison") ?? lesson.bridges.find((b) => b.domain === "general")!;
  const item = getItemByFamily(lesson.primaryFamily)!;
  const short = lesson.shortFamily ? getItemByFamily(lesson.shortFamily) : null;
  const { bridges: _b, ...rest } = lesson;
  void _b;
  return { learner: SAMPLE_LEARNER, lesson: rest, bridge, item: publicItem(item), shortItem: short ? publicItem(short) : null };
}

/** Grades a sample answer without saving anything. */
export function gradeSample(family: string, submission: Record<string, unknown>) {
  const item = getItemByFamily(family);
  if (!item) return null;
  const rubric = getRubric(item.rubricId)!;
  const o = item.prompt.kind === "selected" ? gradeSelected(item, rubric, submission) : gradeWrittenByCues(item, rubric, submission);
  return { result: o.result, summary: o.summary, mainGap: o.mainGap, nextMove: o.nextMove, criteria: o.criteria.map((c) => ({ id: c.id, label: c.label, critical: c.critical, status: c.status })) };
}
