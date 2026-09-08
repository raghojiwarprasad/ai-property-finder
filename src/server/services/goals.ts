import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { clock, config, newId } from "@/server/lib/util";
import { invalid, notFound } from "@/server/lib/errors";
import { track } from "@/server/lib/analytics";
import { getCatalogue } from "@/content";
import type { Destination, Milestone } from "@/content/types";
import { GatewayError, gatewayMode, runTask } from "@/server/gateway";
import { DESTINATION_META, interpretGoalRules, type GoalInterpretation } from "./goalRules";
import { eligibleFacts } from "./experience";
import { computeNextActivity, getProjections, recordPathRevision } from "./learning";
import type { GoalCoverage } from "@/server/db/schema";

export type GoalProposal = {
  goalVersionId: string;
  originalText: string;
  interpretation: string;
  destination: Destination;
  destinationLabel: string;
  inScope: boolean;
  aiReformulation: string | null;
  clarifyingQuestion: string | null;
  provisional: boolean;
  interpreter: "rules" | "live";
  firstMilestone: { id: string; title: string; outcome: string; evidenceRequirement: string } | null;
  coverage: GoalCoverage;
  contextFacts: Array<{ id: string; factType: string; value: string; sourceType: string }>;
  researchNote: string | null;
  milestones: Array<{ id: string; title: string; status: "published" | "planned"; optional: boolean }>;
};

export function milestonesForDestination(destination: Destination): Milestone[] {
  const cat = getCatalogue();
  const list = cat.effectiveMilestones.filter((m) => m.destinations.includes(destination));
  return list.sort((a, b) => Number(a.optional) - Number(b.optional) || a.bundle.localeCompare(b.bundle) || a.order - b.order);
}

export function coverageFor(destination: Destination): GoalCoverage {
  const ms = milestonesForDestination(destination);
  const published = ms.filter((m) => m.status === "published").map((m) => m.id);
  const planned = ms.filter((m) => m.status === "planned").map((m) => m.id);
  const gapNote =
    destination === "research"
      ? "Your destination includes research. We'll begin with the foundations you need; later milestones are planned and not yet available."
      : planned.length > 0
        ? "Some later milestones are planned and not yet available."
        : null;
  return { published, planned, unsupported: [], gapNote };
}

/** Interpret a goal and save it as a draft goal version (PRD-02 F01, F02, F05, F07). */
export async function interpretGoal(learnerId: string, goalText: string, opts: { sessionMinutes?: 10 | 20 | 40 } = {}): Promise<GoalProposal> {
  const text = goalText.trim();
  if (text.length < config.goalMinChars) throw invalid("Write a few words about what you want to do with AI.");
  if (text.length > config.goalMaxChars) throw invalid("Keep the goal under 1,000 characters.");
  let interp: GoalInterpretation;
  let interpreter: "rules" | "live" = "rules";
  const rules = interpretGoalRules(text);
  if (gatewayMode() === "live") {
    try {
      const r = await runTask("interpret_goal", {
        goalText: text,
        destinations: (Object.keys(DESTINATION_META) as Destination[]).map((id) => ({ id, label: DESTINATION_META[id].label, description: DESTINATION_META[id].description })),
      }, { learnerId });
      interp = { ...r.output, provisional: r.output.clarifyingQuestion !== null || r.output.destination === "foundations" };
      interpreter = "live";
    } catch (err) {
      if (!(err instanceof GatewayError)) throw err;
      interp = rules; // honest fallback to reviewed mappings
    }
  } else {
    interp = rules;
  }
  const db = await getDb();
  const coverage = coverageFor(interp.destination);
  const prior = await db.select({ version: schema.goalVersions.version }).from(schema.goalVersions).where(eq(schema.goalVersions.learnerId, learnerId)).orderBy(desc(schema.goalVersions.version)).limit(1);
  const version = (prior[0]?.version ?? 0) + 1;
  const ms = milestonesForDestination(interp.destination);
  const id = newId("goal");
  await db.insert(schema.goalVersions).values({
    id, learnerId, version, originalText: text, interpretation: interp.interpretation, destination: interp.destination,
    targetCapabilityIds: Array.from(new Set(ms.flatMap((m) => m.capabilityIds))), milestoneIds: ms.map((m) => m.id),
    depth: DESTINATION_META[interp.destination].depth, coverage, provisional: interp.provisional,
    clarification: interp.clarifyingQuestion ? { question: interp.clarifyingQuestion, options: ["Use AI in my daily work", "Understand how it works", "Build something", "Decide what to invest in"] } : null,
    interpreter, status: "draft", outOfScope: !interp.inScope,
  });
  if (opts.sessionMinutes) {
    const l = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0];
    if (l) await db.update(schema.learners).set({ preferences: { ...l.preferences, sessionMinutes: opts.sessionMinutes } }).where(eq(schema.learners.id, learnerId));
  }
  await track("goal_submitted", learnerId, { destination: interp.destination, inScope: interp.inScope, interpreter, provisional: interp.provisional });
  return toProposal(learnerId, id);
}

export async function toProposal(learnerId: string, goalVersionId: string): Promise<GoalProposal> {
  const db = await getDb();
  const g = (await db.select().from(schema.goalVersions).where(eq(schema.goalVersions.id, goalVersionId)).limit(1))[0];
  if (!g || g.learnerId !== learnerId) throw notFound("Goal not found.");
  const ms = milestonesForDestination(g.destination as Destination);
  const first = ms.find((m) => m.status === "published" && !m.optional) ?? null;
  const facts = await eligibleFacts(learnerId, 2);
  return {
    goalVersionId: g.id, originalText: g.originalText, interpretation: g.interpretation, destination: g.destination as Destination,
    destinationLabel: DESTINATION_META[g.destination as Destination].label, inScope: !g.outOfScope,
    aiReformulation: g.outOfScope ? interpretGoalRules(g.originalText).aiReformulation : null,
    clarifyingQuestion: g.clarification?.question ?? null, provisional: g.provisional, interpreter: g.interpreter as "rules" | "live",
    firstMilestone: first ? { id: first.id, title: first.title, outcome: first.outcome, evidenceRequirement: first.evidenceRequirement } : null,
    coverage: g.coverage, contextFacts: facts.map((f) => ({ id: f.id, factType: f.factType, value: f.value, sourceType: f.sourceType })),
    researchNote: g.destination === "research" ? "Your destination includes research. We'll begin with the foundations you need. Advanced milestones are shown as Planned until their content is published." : null,
    milestones: ms.map((m) => ({ id: m.id, title: m.title, status: m.status, optional: m.optional })),
  };
}

/** Edit the interpretation wording without changing the original text (PRD-02 F01). */
export async function editInterpretation(learnerId: string, goalVersionId: string, interpretation: string): Promise<GoalProposal> {
  const db = await getDb();
  const text = interpretation.trim().slice(0, 300);
  if (text.length < 5) throw invalid("Write a short interpretation.");
  const r = await db.update(schema.goalVersions).set({ interpretation: text }).where(and(eq(schema.goalVersions.id, goalVersionId), eq(schema.goalVersions.learnerId, learnerId))).returning();
  if (r.length === 0) throw notFound("Goal not found.");
  await track("goal_interpretation_edited", learnerId, { goalVersionId });
  return toProposal(learnerId, goalVersionId);
}

/** Answer (or skip) the single optional clarification (PRD-02 F05). */
export async function clarifyGoal(learnerId: string, goalVersionId: string, answer: string | null): Promise<GoalProposal> {
  const db = await getDb();
  const g = (await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.id, goalVersionId), eq(schema.goalVersions.learnerId, learnerId))).limit(1))[0];
  if (!g) throw notFound("Goal not found.");
  if (!answer) {
    await db.update(schema.goalVersions).set({ clarification: null, provisional: true }).where(eq(schema.goalVersions.id, g.id));
    return toProposal(learnerId, g.id);
  }
  const interp = interpretGoalRules(`${g.originalText}. First I want to: ${answer}`);
  const destination = interp.destination === "foundations" ? "use" : interp.destination;
  const ms = milestonesForDestination(destination);
  await db.update(schema.goalVersions).set({
    destination, interpretation: interp.interpretation, coverage: coverageFor(destination), provisional: false, clarification: null,
    targetCapabilityIds: Array.from(new Set(ms.flatMap((m) => m.capabilityIds))), milestoneIds: ms.map((m) => m.id), depth: DESTINATION_META[destination].depth,
  }).where(eq(schema.goalVersions.id, g.id));
  return toProposal(learnerId, g.id);
}

/** Activate a goal and create the first activity idempotently (PRD-02, POST /api/goals/:id/activate). */
export async function activateGoal(learnerId: string, goalVersionId: string): Promise<{ goalVersionId: string; assignmentId: string | null }> {
  const db = await getDb();
  const g = (await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.id, goalVersionId), eq(schema.goalVersions.learnerId, learnerId))).limit(1))[0];
  if (!g) throw notFound("Goal not found.");
  if (g.outOfScope) throw invalid("This goal is outside the AI subject scope. Accept the AI interpretation or write a different goal.");
  if (g.status === "active") {
    const next = await computeNextActivity(learnerId);
    return { goalVersionId: g.id, assignmentId: next.assignment?.id ?? null };
  }
  const now = clock.now();
  const previousActive = await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active")));
  for (const p of previousActive) {
    await db.update(schema.goalVersions).set({ status: "archived", archivedAt: now }).where(eq(schema.goalVersions.id, p.id));
    // Assignments of the old goal are superseded, never deleted (evidence and work are preserved).
    await db.update(schema.activityAssignments).set({ state: "superseded" }).where(and(eq(schema.activityAssignments.learnerId, learnerId), eq(schema.activityAssignments.goalVersionId, p.id), eq(schema.activityAssignments.state, "assigned")));
  }
  await db.update(schema.goalVersions).set({ status: "active", activatedAt: now }).where(eq(schema.goalVersions.id, g.id));
  await db.update(schema.learners).set({ stateVersion: (await stateVersion(learnerId)) + 1 }).where(eq(schema.learners.id, learnerId));
  await recordPathRevision(learnerId, g.id, previousActive.length > 0 ? "GOAL_CHANGED" : "GOAL_ACTIVATED", previousActive.length > 0 ? "You changed your goal. Compatible evidence carries forward." : "Your goal is set. The first activity is ready.", null);
  await track(previousActive.length > 0 ? "goal_changed" : "goal_activated", learnerId, { destination: g.destination });
  const next = await computeNextActivity(learnerId);
  return { goalVersionId: g.id, assignmentId: next.assignment?.id ?? null };
}

async function stateVersion(learnerId: string): Promise<number> {
  const db = await getDb();
  const l = (await db.select({ v: schema.learners.stateVersion }).from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0];
  return l?.v ?? 1;
}

export async function activeGoal(learnerId: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active"))).orderBy(desc(schema.goalVersions.version)).limit(1);
  return rows[0] ?? null;
}

export async function goalHistory(learnerId: string) {
  const db = await getDb();
  return db.select().from(schema.goalVersions).where(eq(schema.goalVersions.learnerId, learnerId)).orderBy(desc(schema.goalVersions.version));
}

/** Before/after preview for a goal change (PRD-02 F03, PRD-07 F06). */
export async function previewGoalChange(learnerId: string, destination: Destination): Promise<{
  carried: Array<{ capabilityId: string; title: string; state: string }>;
  newRequirements: Array<{ capabilityId: string; title: string; state: string }>;
  planned: string[];
}> {
  const cat = getCatalogue();
  const projections = await getProjections(learnerId);
  const ms = milestonesForDestination(destination);
  // Route capabilities plus their prerequisites (transitively): evidence for a prerequisite carries too.
  const caps: string[] = [];
  const visit = (id: string) => {
    if (caps.includes(id)) return;
    caps.push(id);
    for (const pre of cat.capabilities.find((c) => c.id === id)?.prerequisites ?? []) visit(pre);
  };
  for (const id of ms.filter((m) => !m.optional).flatMap((m) => m.capabilityIds)) visit(id);
  const carried: Array<{ capabilityId: string; title: string; state: string }> = [];
  const newRequirements: Array<{ capabilityId: string; title: string; state: string }> = [];
  for (const id of caps) {
    const cap = cat.capabilities.find((c) => c.id === id);
    if (!cap) continue;
    const p = projections.find((x) => x.capabilityId === id);
    const state = p?.state ?? "unknown";
    if (state === "demonstrated" || state === "practising" || state === "needs_review") carried.push({ capabilityId: id, title: cap.title, state });
    else newRequirements.push({ capabilityId: id, title: cap.title, state });
  }
  return { carried, newRequirements, planned: ms.filter((m) => m.status === "planned").map((m) => m.title) };
}
