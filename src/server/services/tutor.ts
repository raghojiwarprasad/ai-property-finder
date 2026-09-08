import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { clock, newId } from "@/server/lib/util";
import { forbidden, invalid } from "@/server/lib/errors";
import { audit, track } from "@/server/lib/analytics";
import { getCatalogue, getItem } from "@/content";
import { GatewayError, runTask } from "@/server/gateway";
import { getAssignment, recordAssistance } from "./learning";
import { eligibleFacts } from "./experience";

/**
 * Contextual tutor (PRD-05). Scoped to one activity; grounded in the current block; hint
 * ladder before a worked solution during assessed work; cannot grade or commit state.
 */

export type TutorMessageView = { id: string; role: "learner" | "tutor"; content: string; status: string; assistanceLevel: string | null; providerMode: string | null; createdAt: string; reported: boolean };

export async function getThread(learnerId: string, assignmentId: string): Promise<TutorMessageView[]> {
  const db = await getDb();
  await getAssignment(learnerId, assignmentId);
  const thread = (await db.select().from(schema.tutorThreads).where(and(eq(schema.tutorThreads.learnerId, learnerId), eq(schema.tutorThreads.assignmentId, assignmentId))).limit(1))[0];
  if (!thread) return [];
  const msgs = await db.select().from(schema.tutorMessages).where(eq(schema.tutorMessages.threadId, thread.id)).orderBy(asc(schema.tutorMessages.createdAt));
  return msgs.map(toView);
}

function toView(m: typeof schema.tutorMessages.$inferSelect): TutorMessageView {
  return { id: m.id, role: m.role as "learner" | "tutor", content: m.content, status: m.status, assistanceLevel: m.assistanceLevel, providerMode: m.providerMode, createdAt: m.createdAt.toISOString(), reported: Boolean(m.reportedAt) };
}

export async function sendMessage(learnerId: string, input: { assignmentId: string; question: string; selection?: string | null; blockId?: string | null; requestKey: string; explicitSolutionRequest?: boolean }): Promise<{ learner: TutorMessageView; tutor: TutorMessageView }> {
  const db = await getDb();
  const question = input.question.trim().slice(0, 2000);
  if (question.length < 1) throw invalid("Type a question first.");
  const assignment = await getAssignment(learnerId, input.assignmentId);
  let thread = (await db.select().from(schema.tutorThreads).where(and(eq(schema.tutorThreads.learnerId, learnerId), eq(schema.tutorThreads.assignmentId, assignment.id))).limit(1))[0];
  if (!thread) [thread] = await db.insert(schema.tutorThreads).values({ id: newId("thr"), learnerId, assignmentId: assignment.id }).returning();

  // Idempotent by request key: a retry after a dropped connection returns the same pair without a duplicate entry (PRD-05 F06).
  const existing = await db.select().from(schema.tutorMessages).where(and(eq(schema.tutorMessages.threadId, thread.id), eq(schema.tutorMessages.requestKey, input.requestKey)));
  const existingLearner = existing.find((m) => m.role === "learner");
  const existingTutor = existing.find((m) => m.role === "tutor");
  if (existingLearner && existingTutor && existingTutor.status === "complete") return { learner: toView(existingLearner), tutor: toView(existingTutor) };

  const learnerMsg = existingLearner ?? (await db.insert(schema.tutorMessages).values({ id: newId("msg"), threadId: thread.id, learnerId, role: "learner", content: question, status: "complete", selection: input.selection?.slice(0, 1000) ?? null, requestKey: input.requestKey }).returning())[0];
  await track("tutor_question_submitted", learnerId, { assignmentId: assignment.id });

  const lesson = assignment.lessonId ? getCatalogue().lessons.find((l) => l.id === assignment.lessonId) : null;
  const item = assignment.itemId ? getItem(assignment.itemId) : null;
  const blockText = (() => {
    if (input.blockId && lesson) {
      const b = lesson.blocks.find((x) => x.id === input.blockId);
      if (b && "text" in b) return b.text;
    }
    if (item) return `${item.objective}\n${item.supplied.map((s) => `${s.label}: ${s.text}`).join("\n")}\n${item.prompt.question}`;
    return lesson ? lesson.blocks.filter((b) => b.type === "concept").map((b) => (b.type === "concept" ? b.text : "")).join("\n") : "";
  })();
  const assistanceSoFar = (await db.select().from(schema.assistanceEvents).where(and(eq(schema.assistanceEvents.learnerId, learnerId), eq(schema.assistanceEvents.assignmentId, assignment.id)))).map((a) => a.kind);
  const recent = (await db.select().from(schema.tutorMessages).where(eq(schema.tutorMessages.threadId, thread.id)).orderBy(asc(schema.tutorMessages.createdAt))).filter((m) => m.status === "complete" && m.id !== learnerMsg.id).slice(-8);
  const facts = await eligibleFacts(learnerId, 2);
  const taskMode = item && assignment.state !== "completed" ? "assessed_work" : "reading";
  const explicit = Boolean(input.explicitSolutionRequest) || /\b(full|complete|whole|worked) (answer|solution)\b|\bshow me the answer\b|\bjust tell me\b/i.test(question);

  let tutorMsg = existingTutor;
  const pendingId = tutorMsg?.id ?? newId("msg");
  if (!tutorMsg) [tutorMsg] = await db.insert(schema.tutorMessages).values({ id: pendingId, threadId: thread.id, learnerId, role: "tutor", content: "", status: "pending", requestKey: input.requestKey }).returning();
  try {
    const r = await runTask("tutor", {
      objective: item?.objective ?? lesson?.outcome ?? "Understand the current idea.", currentBlock: blockText.slice(0, 4000), selection: input.selection ?? null, taskMode,
      assistanceSoFar, hints: item?.hints ?? [], recentThread: recent.map((m) => ({ role: m.role as "learner" | "tutor", content: m.content })), question, explicitSolutionRequest: explicit,
      facts: facts.map((f) => ({ factType: f.factType, value: f.value })),
    }, { learnerId });
    const level = r.output.assistanceLevel;
    if (taskMode === "assessed_work" && level === "hint") await recordAssistance(learnerId, assignment.id, `hint_${Math.min(assistanceSoFar.filter((k) => k.startsWith("hint")).length + 1, 3)}`);
    if (level === "worked_solution") await recordAssistance(learnerId, assignment.id, "tutor_solution");
    const [saved] = await db.update(schema.tutorMessages).set({ content: r.output.response, status: "complete", assistanceLevel: level, promptVersion: r.promptVersion, providerMode: r.mode }).where(eq(schema.tutorMessages.id, pendingId)).returning();
    return { learner: toView(learnerMsg), tutor: toView(saved) };
  } catch (err) {
    const cls = err instanceof GatewayError ? err.errorClass : "error";
    const [failed] = await db.update(schema.tutorMessages).set({ content: cls === "cancelled" ? "Stopped before the response finished." : "The tutor is unavailable right now. Your question is saved; try again in a moment.", status: cls === "cancelled" ? "incomplete" : "failed", providerMode: null }).where(eq(schema.tutorMessages.id, pendingId)).returning();
    await track("tutor_response_failed", learnerId, { assignmentId: assignment.id, errorClass: cls });
    return { learner: toView(learnerMsg), tutor: toView(failed) };
  }
}

export async function reportMessage(learnerId: string, messageId: string, description: string): Promise<void> {
  const db = await getDb();
  const m = (await db.select().from(schema.tutorMessages).where(eq(schema.tutorMessages.id, messageId)).limit(1))[0];
  if (!m || m.learnerId !== learnerId) {
    await audit(learnerId, "report", "tutor_message", messageId, "denied");
    throw forbidden("That message is not yours.");
  }
  await db.update(schema.tutorMessages).set({ reportedAt: clock.now() }).where(eq(schema.tutorMessages.id, messageId));
  const thread = (await db.select().from(schema.tutorThreads).where(eq(schema.tutorThreads.id, m.threadId)).limit(1))[0];
  const assignment = thread ? (await db.select().from(schema.activityAssignments).where(eq(schema.activityAssignments.id, thread.assignmentId)).limit(1))[0] : null;
  await db.insert(schema.contentIssues).values({
    id: newId("iss"), learnerId, contentRef: assignment ? `${assignment.lessonId ?? assignment.itemId ?? assignment.capabilityId}@${assignment.contentVersion}` : "unknown", messageId,
    severity: "medium", description: description.trim().slice(0, 1000) || "Learner reported this response as incorrect or unhelpful.", status: "open",
  });
  await track("tutor_response_reported", learnerId, { messageId });
}
