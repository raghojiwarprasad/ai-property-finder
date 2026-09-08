import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { ContextBinding } from "@/server/db/schema";
import { addDays, clock, config, newId, POLICY_VERSION } from "@/server/lib/util";
import { forbidden, invalid, notFound } from "@/server/lib/errors";
import { track, audit } from "@/server/lib/analytics";
import { CONTENT_VERSION, getCapability, getCatalogue, getItem, getItemByFamily, getItemsForCapability, getLessonForCapability, getMilestone, getPracticesForCapability, isCapabilityAvailable, publicItem } from "@/content";
import type { Bridge, Capability, ItemFamily, Lesson, Milestone, PublicItem } from "@/content/types";
import { GatewayError, gatewayMode, runTask } from "@/server/gateway";
import { eligibleFacts, listFacts, type PublicFact } from "./experience";

/**
 * Learning service: activity assignment, evidence projection, review scheduling and path
 * revisions under an explicit, versioned policy (spec/04 §7, PRD-03, PRD-07).
 *
 * Reason codes are the contract with the UI ("Why this next?") and with tests.
 */
export type ReasonCode =
  | "RESUME"
  | "REVIEW_DUE"
  | "TEACH_FIRST"
  | "TEACH_NEXT"
  | "CHECK_FAMILIARITY"
  | "PREREQUISITE_CHECK"
  | "REPAIR_PREREQUISITE"
  | "CHECK_INDEPENDENT"
  | "VERIFY_TRANSFER"
  | "ARTEFACT_REQUIRED"
  | "PRACTICE_SIMULATION"
  | "REPAIR_MISCONCEPTION"
  | "REDUCE_SUPPORT"
  | "FRESH_VARIANT_AFTER_ASSISTANCE"
  | "LEARNER_CLAIM_CHECK"
  | "SHORT_SESSION"
  | "GOAL_ACTIVATED"
  | "GOAL_CHANGED"
  | "MILESTONE_COMPLETE"
  | "GOAL_COMPLETE"
  | "COVERAGE_LIMIT"
  | "NO_GOAL";

type Assignment = typeof schema.activityAssignments.$inferSelect;
type Projection = typeof schema.capabilityProjections.$inferSelect;

export type NextActivity = {
  assignment: Assignment | null;
  reasonCode: ReasonCode;
  reasonText: string;
  coverageNote: string | null;
};

const REASON_TEXT: Record<ReasonCode, string> = {
  RESUME: "You have an activity in progress. Pick up where you left off.",
  REVIEW_DUE: "A short check is due on something you demonstrated earlier. It keeps the capability current.",
  TEACH_FIRST: "This is the first capability in your milestone. It starts from something you already know.",
  TEACH_NEXT: "You are ready for the next capability in this milestone; its prerequisites are in place.",
  CHECK_FAMILIARITY: "Your experience suggests you may already know this. A short check lets you skip the lesson if so.",
  PREREQUISITE_CHECK: "The next capability depends on one we have not seen evidence for yet. A quick check decides whether to teach it first.",
  REPAIR_PREREQUISITE: "A prerequisite needs attention before the next step makes sense. Your destination is unchanged.",
  CHECK_INDEPENDENT: "You have read the idea. Now show it without help so it can count as evidence.",
  VERIFY_TRANSFER: "You used the idea in a familiar setting. Now try the same check in a different situation.",
  ARTEFACT_REQUIRED: "This capability is demonstrated through a piece of work you can reuse.",
  PRACTICE_SIMULATION: "This capability is demonstrated by making choices in a simulation and seeing the consequences.",
  REPAIR_MISCONCEPTION: "Your last answer showed a specific gap. This activity targets that gap rather than repeating the lesson.",
  REDUCE_SUPPORT: "Two different attempts missed the same idea. This version breaks the task down and changes the explanation.",
  FRESH_VARIANT_AFTER_ASSISTANCE: "You used a worked answer, so a fresh variant is needed for independent evidence.",
  LEARNER_CLAIM_CHECK: "You said you know this. A fresh check lets you skip ahead if so.",
  SHORT_SESSION: "You have a short session, so this is a smaller task that still counts.",
  GOAL_ACTIVATED: "Your goal is set.",
  GOAL_CHANGED: "You changed your goal.",
  MILESTONE_COMPLETE: "You completed this milestone. The next one is ready.",
  GOAL_COMPLETE: "You have demonstrated every published capability for this goal.",
  COVERAGE_LIMIT: "The next milestone is planned but not yet published. Review and practice are available meanwhile.",
  NO_GOAL: "Set a goal to get a first lesson.",
};

// ---------------------------------------------------------------------------
// Projections and evidence
// ---------------------------------------------------------------------------

export async function getProjections(learnerId: string): Promise<Projection[]> {
  const db = await getDb();
  return db.select().from(schema.capabilityProjections).where(eq(schema.capabilityProjections.learnerId, learnerId));
}

/** Rebuilds a capability projection from evidence events and exposure (spec/04 §4–5). */
export async function recomputeProjection(learnerId: string, capabilityId: string): Promise<Projection> {
  const db = await getDb();
  const cap = getCapability(capabilityId);
  if (!cap) throw notFound(`Unknown capability ${capabilityId}`);
  const events = (await db.select().from(schema.evidenceEvents).where(and(eq(schema.evidenceEvents.learnerId, learnerId), eq(schema.evidenceEvents.capabilityId, capabilityId)))).filter((e) => !e.supersededBy);
  const existing = (await db.select().from(schema.capabilityProjections).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId))).limit(1))[0];
  const exposure = await db.select({ id: schema.activityAssignments.id }).from(schema.activityAssignments).where(and(eq(schema.activityAssignments.learnerId, learnerId), eq(schema.activityAssignments.capabilityId, capabilityId), eq(schema.activityAssignments.activityType, "lesson"))).limit(1);
  const exposureDone = (await db.select({ id: schema.activityAssignments.id }).from(schema.activityAssignments).where(and(eq(schema.activityAssignments.learnerId, learnerId), eq(schema.activityAssignments.capabilityId, capabilityId), eq(schema.activityAssignments.activityType, "lesson"), eq(schema.activityAssignments.state, "completed")))).length > 0;
  void exposure;

  const passedFamilies = new Set<string>();
  const failedFamilies = new Set<string>();
  let transferPassed = false;
  let artefactPassed = false;
  let lastIndependentAt: Date | null = null;
  let anyEvidence = false;
  let reviewFailed = false;
  let reviewPassedAt: Date | null = null;
  for (const e of events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    anyEvidence = true;
    if (e.taskKind === "review") {
      if (e.result === "pass") { reviewPassedAt = e.createdAt; reviewFailed = false; }
      else reviewFailed = true;
      continue;
    }
    if (e.result === "pass" && e.independent) {
      passedFamilies.add(e.itemFamily);
      failedFamilies.delete(e.itemFamily);
      if (e.taskKind === "transfer") transferPassed = true;
      if (e.taskKind === "artefact" || e.taskKind === "simulation") artefactPassed = true;
      lastIndependentAt = e.createdAt;
    } else if (e.result === "fail" && !passedFamilies.has(e.itemFamily)) {
      failedFamilies.add(e.itemFamily);
    }
  }
  const contract = cap.evidenceContract;
  const demonstrated = passedFamilies.size >= contract.requiredFamilies && (!contract.requireTransfer || transferPassed) && (!contract.requireArtefact || artefactPassed);
  const now = clock.now();
  let state: Projection["state"];
  let reason: string;
  let demonstratedAt = existing?.demonstratedAt ?? null;
  let reviewDueAt = existing?.reviewDueAt ?? null;
  let reviewStage = existing?.reviewStage ?? 0;
  if (demonstrated) {
    if (!demonstratedAt) {
      demonstratedAt = now;
      reviewStage = 0;
      reviewDueAt = addDays(now, config.reviewIntervalsDays[0]);
    }
    if (reviewPassedAt && existing?.reviewDueAt && reviewPassedAt.getTime() >= existing.reviewDueAt.getTime() - 1000) {
      // A passed review after it was due advances the schedule.
    }
    if (reviewFailed) {
      state = "needs_review";
      reason = "A recent review check missed the idea. A focused repair is scheduled; earlier demonstrations are kept.";
    } else if (reviewDueAt && reviewDueAt.getTime() <= now.getTime()) {
      state = "needs_review";
      reason = "Demonstrated earlier; a scheduled review is due.";
    } else {
      state = "demonstrated";
      reason = `Demonstrated with ${passedFamilies.size} independent item families${transferPassed ? " including transfer" : ""}${artefactPassed ? " and a reviewed artefact" : ""}.`;
    }
  } else if (anyEvidence) {
    state = "practising";
    const missing: string[] = [];
    if (passedFamilies.size < contract.requiredFamilies) missing.push(`${contract.requiredFamilies - passedFamilies.size} more independent item famil${contract.requiredFamilies - passedFamilies.size === 1 ? "y" : "ies"}`);
    if (contract.requireTransfer && !transferPassed) missing.push("a transfer task");
    if (contract.requireArtefact && !artefactPassed) missing.push("an artefact or simulation");
    reason = `${passedFamilies.size} independent famil${passedFamilies.size === 1 ? "y" : "ies"} passed; still needed: ${missing.join(", ")}.`;
  } else if (exposureDone) {
    state = "introduced";
    reason = "Lesson read; no independent evidence yet.";
  } else {
    state = "unknown";
    reason = "No evidence yet.";
  }
  const row = {
    learnerId, capabilityId, state, depth: cap.depths[cap.depths.length - 1],
    supportingEvidenceIds: events.filter((e) => e.result === "pass" && e.independent).map((e) => e.id),
    passedFamilies: Array.from(passedFamilies), transferPassed, artefactPassed,
    distinctFailures: failedFamilies.size, failedFamilies: Array.from(failedFamilies),
    lastIndependentAt, demonstratedAt, reviewDueAt, reviewStage, reason, updatedAt: now,
  };
  if (existing) await db.update(schema.capabilityProjections).set(row).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId)));
  else await db.insert(schema.capabilityProjections).values(row);
  return (await db.select().from(schema.capabilityProjections).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId))).limit(1))[0];
}

/** Advances the review schedule after a passed review (2, 7, 21 days; PRD-07 F05). */
export async function advanceReview(learnerId: string, capabilityId: string, passed: boolean): Promise<void> {
  const db = await getDb();
  const p = (await db.select().from(schema.capabilityProjections).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId))).limit(1))[0];
  if (!p) return;
  const now = clock.now();
  if (passed) {
    const stage = Math.min(p.reviewStage + 1, config.reviewIntervalsDays.length - 1);
    await db.update(schema.capabilityProjections).set({ reviewStage: stage, reviewDueAt: addDays(now, config.reviewIntervalsDays[stage]), state: "demonstrated", reason: `Review passed; next review in ${config.reviewIntervalsDays[stage]} days.`, updatedAt: now }).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId)));
  } else {
    await db.update(schema.capabilityProjections).set({ reviewDueAt: addDays(now, config.reviewIntervalsDays[0]), reviewStage: 0, state: "needs_review", reason: "Review missed the idea; a focused repair is next. Earlier demonstrations are kept.", updatedAt: now }).where(and(eq(schema.capabilityProjections.learnerId, learnerId), eq(schema.capabilityProjections.capabilityId, capabilityId)));
  }
}

// ---------------------------------------------------------------------------
// Path revisions and assignments
// ---------------------------------------------------------------------------

export async function recordPathRevision(learnerId: string, goalVersionId: string, reasonCode: ReasonCode, reasonText: string, nextAssignmentId: string | null, evidenceSnapshot: Record<string, unknown> = {}): Promise<void> {
  const db = await getDb();
  const prev = await db.select({ id: schema.pathRevisions.id }).from(schema.pathRevisions).where(eq(schema.pathRevisions.learnerId, learnerId)).orderBy(desc(schema.pathRevisions.createdAt)).limit(1);
  const learner = (await db.select({ v: schema.learners.stateVersion }).from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0];
  await db.insert(schema.pathRevisions).values({
    id: newId("rev"), learnerId, goalVersionId, previousRevisionId: prev[0]?.id ?? null, nextAssignmentId, reasonCode, reasonText, evidenceSnapshot, policyVersion: POLICY_VERSION, stateVersion: learner?.v ?? 1,
  });
}

async function openAssignment(learnerId: string): Promise<Assignment | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.activityAssignments).where(and(eq(schema.activityAssignments.learnerId, learnerId), inArray(schema.activityAssignments.state, ["assigned", "in_progress"]))).orderBy(desc(schema.activityAssignments.createdAt)).limit(1);
  return rows[0] ?? null;
}

type Proposal = {
  activityType: Assignment["activityType"];
  milestoneId: string;
  capabilityId: string;
  lesson?: Lesson;
  item?: ItemFamily;
  practiceId?: string;
  reasonCode: ReasonCode;
  evidenceIds: string[];
  shortened?: boolean;
};

/**
 * Deterministic next-activity policy (spec/04 §7). Returns the open assignment when one
 * exists; otherwise proposes, validates and commits a new assignment with a path revision.
 */
export async function computeNextActivity(learnerId: string, opts: { force?: boolean; ignoreOpen?: boolean } = {}): Promise<NextActivity> {
  const db = await getDb();
  const goal = (await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active"))).limit(1))[0];
  if (!goal) return { assignment: null, reasonCode: "NO_GOAL", reasonText: REASON_TEXT.NO_GOAL, coverageNote: null };

  if (!opts.ignoreOpen) {
    const open = await openAssignment(learnerId);
    if (open) return { assignment: open, reasonCode: open.state === "in_progress" ? "RESUME" : (open.reasonCode as ReasonCode), reasonText: open.reasonText, coverageNote: null };
  }

  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  const projections = await getProjections(learnerId);
  const projByCap = new Map(projections.map((p) => [p.capabilityId, p]));
  const facts = await listFacts(learnerId);
  const cat = getCatalogue();
  const milestones = goal.milestoneIds.map((id) => cat.effectiveMilestones.find((m) => m.id === id)).filter((m): m is Milestone => Boolean(m));
  const shortSession = learner.preferences.sessionMinutes === 10;

  // 1. Due review relevant to the current goal (bounded to one per session).
  const dueReview = projections
    .filter((p) => p.state === "needs_review" && goal.targetCapabilityIds.includes(p.capabilityId) && isCapabilityAvailable(p.capabilityId))
    .sort((a, b) => (a.reviewDueAt?.getTime() ?? 0) - (b.reviewDueAt?.getTime() ?? 0))[0];
  const recentReview = (await db.select({ id: schema.activityAssignments.id, createdAt: schema.activityAssignments.createdAt }).from(schema.activityAssignments).where(and(eq(schema.activityAssignments.learnerId, learnerId), eq(schema.activityAssignments.activityType, "review"))).orderBy(desc(schema.activityAssignments.createdAt)).limit(1))[0];
  const reviewBudgetSpent = recentReview && clock.now().getTime() - recentReview.createdAt.getTime() < 6 * 3600_000;
  let proposal: Proposal | null = null;
  if (dueReview && !reviewBudgetSpent) {
    const item = pickReviewItem(dueReview);
    if (item) proposal = { activityType: "review", milestoneId: milestoneFor(milestones, dueReview.capabilityId), capabilityId: dueReview.capabilityId, item, reasonCode: "REVIEW_DUE", evidenceIds: dueReview.supportingEvidenceIds };
  }

  // 2. Highest-priority missing capability whose prerequisites are satisfied or checkable.
  let coverageNote: string | null = null;
  let milestoneJustCompleted = false;
  if (!proposal) {
    const completedMilestones = new Set<string>();
    for (const m of milestones) {
      if (m.optional) continue;
      if (m.status !== "published") {
        coverageNote = `“${m.title}” is planned and not yet available.`;
        continue;
      }
      const allDone = m.capabilityIds.every((c) => ["demonstrated", "needs_review"].includes(projByCap.get(c)?.state ?? "unknown"));
      if (allDone) { completedMilestones.add(m.id); continue; }
      for (const capId of m.capabilityIds) {
        const cap = getCapability(capId);
        if (!cap || !isCapabilityAvailable(capId)) continue;
        const p = projByCap.get(capId);
        const state = p?.state ?? "unknown";
        if (state === "demonstrated" || state === "needs_review") continue;
        // A learner whose experience suggests familiarity gets the capability's own check first (CV signals select a check; they never satisfy a gate).
        if (!p && factsSuggestFamiliarity(cap, facts)) {
          proposal = await proposeForCapability(learnerId, m, cap, null, facts, shortSession, null, goal.destination);
          if (proposal) break;
        }
        // Prerequisites
        for (const preId of cap.prerequisites) {
          if (!isCapabilityAvailable(preId)) continue;
          const pre = projByCap.get(preId);
          const preState = pre?.state ?? "unknown";
          if (preState === "demonstrated" || preState === "needs_review") continue;
          if (preState === "unknown" || preState === "introduced") {
            const check = await choosePrerequisiteCheck(learnerId, preId);
            if (check) { proposal = { activityType: "check", milestoneId: m.id, capabilityId: preId, item: check, reasonCode: "PREREQUISITE_CHECK", evidenceIds: [] }; break; }
          }
          if (preState === "practising") {
            proposal = await proposeForCapability(learnerId, m, getCapability(preId)!, pre!, facts, shortSession, "REPAIR_PREREQUISITE", goal.destination);
            if (proposal) break;
          }
        }
        if (proposal) break;
        proposal = await proposeForCapability(learnerId, m, cap, p ?? null, facts, shortSession, null, goal.destination);
        if (proposal) break;
      }
      if (proposal) {
        milestoneJustCompleted = completedMilestones.size > 0 && completedMilestones.size === milestones.filter((x) => !x.optional && x.status === "published").indexOf(m);
        break;
      }
    }
    if (!proposal) {
      const publishedRequired = milestones.filter((m) => !m.optional && m.status === "published");
      const allComplete = publishedRequired.every((m) => completedMilestones.has(m.id));
      const anyPlanned = milestones.some((m) => !m.optional && m.status === "planned");
      const code: ReasonCode = allComplete && anyPlanned ? "COVERAGE_LIMIT" : allComplete ? "GOAL_COMPLETE" : "COVERAGE_LIMIT";
      return { assignment: null, reasonCode: code, reasonText: REASON_TEXT[code], coverageNote };
    }
  }

  // Validate and commit: content availability, duplication, versions.
  const assignment = await commitProposal(learnerId, goal.id, proposal, learner.stateVersion, milestoneJustCompleted);
  return { assignment, reasonCode: proposal.reasonCode, reasonText: assignment.reasonText, coverageNote };
}

function milestoneFor(milestones: Milestone[], capabilityId: string): string {
  return milestones.find((m) => m.capabilityIds.includes(capabilityId))?.id ?? milestones[0]?.id ?? "MA1";
}

function pickReviewItem(p: Projection): ItemFamily | undefined {
  const items = getItemsForCapability(p.capabilityId);
  // Prefer a family the learner has not passed, otherwise any short check.
  return items.find((i) => !p.passedFamilies.includes(i.family) && i.prompt.kind === "selected") ?? items.find((i) => i.prompt.kind === "selected") ?? items[0];
}

async function choosePrerequisiteCheck(learnerId: string, capabilityId: string): Promise<ItemFamily | undefined> {
  const attemptedFamilies = await familiesAttempted(learnerId, capabilityId);
  const items = getItemsForCapability(capabilityId).filter((i) => i.taskKind === "check" && !attemptedFamilies.has(i.family));
  return items.find((i) => i.prompt.kind === "selected") ?? items[0];
}

async function familiesAttempted(learnerId: string, capabilityId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select({ family: schema.attempts.itemFamily }).from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.capabilityId, capabilityId)));
  return new Set(rows.map((r) => r.family));
}

async function assistedFamilies(learnerId: string, capabilityId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select({ family: schema.attempts.itemFamily, assisted: schema.attempts.assisted }).from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.capabilityId, capabilityId)));
  return new Set(rows.filter((r) => r.assisted).map((r) => r.family));
}

function factsSuggestFamiliarity(cap: Capability, facts: PublicFact[]): boolean {
  const text = facts.map((f) => f.value.toLowerCase()).join(" ");
  if (["F06", "B01", "B02", "F09"].includes(cap.id)) return /python|api|software|developer|engineer|backend|web service|code/.test(text);
  if (["L01", "F08"].includes(cap.id)) return /budget|director|ceo|founder|managing|approv/.test(text);
  if (["M01", "M02"].includes(cap.id)) return /campaign|marketing|brand|audience|a\/b/.test(text);
  return false;
}

const DESTINATION_DOMAIN: Record<string, string[]> = {
  marketing: ["marketing"], build: ["software"], lead: ["leadership"], research: ["research"], use: ["supplier_comparison", "operations"], foundations: [],
};

async function proposeForCapability(learnerId: string, m: Milestone, cap: Capability, p: Projection | null, facts: PublicFact[], shortSession: boolean, override: ReasonCode | null, destination = ""): Promise<Proposal | null> {
  const lesson = getLessonForCapability(cap.id);
  if (!lesson) return null;
  const preferredDomains = DESTINATION_DOMAIN[destination] ?? [];
  const state = p?.state ?? "unknown";
  const attempted = await familiesAttempted(learnerId, cap.id);
  const assisted = await assistedFamilies(learnerId, cap.id);
  const items = getItemsForCapability(cap.id);
  const fresh = (pred: (i: ItemFamily) => boolean) => items.find((i) => pred(i) && !attempted.has(i.family) && !assisted.has(i.family));
  const base = { milestoneId: m.id, capabilityId: cap.id };

  if (state === "unknown") {
    if (!p && factsSuggestFamiliarity(cap, facts)) {
      const check = fresh((i) => i.taskKind === "check" && i.prompt.kind === "selected") ?? fresh((i) => i.taskKind === "check");
      if (check) return { ...base, activityType: "check", item: check, reasonCode: override ?? "CHECK_FAMILIARITY", evidenceIds: [] };
    }
    const isFirst = m.capabilityIds[0] === cap.id;
    const domainCheck = shortSession ? undefined : items.find((i) => i.taskKind === "check" && i.prompt.kind !== "selected" && preferredDomains.includes(i.domain) && i.family !== lesson.primaryFamily);
    const primary = domainCheck ?? getItemByFamily(shortSession && lesson.shortFamily ? lesson.shortFamily : lesson.primaryFamily);
    return { ...base, activityType: "lesson", lesson, item: primary, reasonCode: override ?? (isFirst ? "TEACH_FIRST" : "TEACH_NEXT"), evidenceIds: [], shortened: shortSession };
  }
  if (state === "introduced") {
    const check = fresh((i) => i.family === lesson.primaryFamily) ?? fresh((i) => i.taskKind === "check") ?? fresh((i) => i.taskKind === "explain");
    if (check) return { ...base, activityType: "check", item: check, reasonCode: override ?? "CHECK_INDEPENDENT", evidenceIds: [] };
  }
  // practising: decide from the evidence contract and failure pattern.
  const proj = p!;
  const contract = cap.evidenceContract;
  const evidenceIds = proj.supportingEvidenceIds;
  if (proj.distinctFailures >= 2 && proj.passedFamilies.length === 0) {
    // Reduce support: re-teach with the simpler explanation and a small selected check.
    const small = fresh((i) => i.prompt.kind === "selected") ?? items.find((i) => i.prompt.kind === "selected");
    return { ...base, activityType: "lesson", lesson, item: small ?? getItemByFamily(lesson.primaryFamily), reasonCode: "REDUCE_SUPPORT", evidenceIds, shortened: true };
  }
  if (proj.distinctFailures >= 1 && proj.passedFamilies.length === 0) {
    const repair = fresh((i) => i.taskKind === "check" && i.family !== lesson.primaryFamily) ?? fresh((i) => i.taskKind === "check") ?? fresh((i) => i.taskKind === "explain");
    if (repair) return { ...base, activityType: "check", item: repair, reasonCode: override ?? "REPAIR_MISCONCEPTION", evidenceIds };
  }
  if (assisted.size > 0 && proj.passedFamilies.length === 0) {
    const variant = fresh((i) => i.taskKind === "check");
    if (variant) return { ...base, activityType: "check", item: variant, reasonCode: "FRESH_VARIANT_AFTER_ASSISTANCE", evidenceIds };
  }
  if (contract.requireTransfer && !proj.transferPassed) {
    const t = fresh((i) => i.taskKind === "transfer");
    if (t) return { ...base, activityType: "transfer", item: t, reasonCode: override ?? "VERIFY_TRANSFER", evidenceIds };
  }
  if (contract.requireArtefact && !proj.artefactPassed) {
    const art = fresh((i) => i.taskKind === "artefact");
    if (art) return { ...base, activityType: "check", item: art, reasonCode: override ?? "ARTEFACT_REQUIRED", evidenceIds };
    const practice = getPracticesForCapability(cap.id)[0];
    if (practice) return { ...base, activityType: "practice", practiceId: practice.id, reasonCode: override ?? "PRACTICE_SIMULATION", evidenceIds };
  }
  if (proj.passedFamilies.length < contract.requiredFamilies) {
    const next = fresh((i) => ["check", "explain"].includes(i.taskKind)) ?? fresh((i) => i.taskKind === "transfer");
    if (next) return { ...base, activityType: next.taskKind === "transfer" ? "transfer" : "check", item: next, reasonCode: override ?? "CHECK_INDEPENDENT", evidenceIds };
  }
  // Every family attempted: allow a repeat of a failed family after the lesson was re-read.
  const retry = items.find((i) => proj.failedFamilies.includes(i.family));
  if (retry) return { ...base, activityType: "check", item: retry, reasonCode: "REPAIR_MISCONCEPTION", evidenceIds };
  return null;
}

async function commitProposal(learnerId: string, goalVersionId: string, proposal: Proposal, stateVersion: number, milestoneJustCompleted: boolean): Promise<Assignment> {
  const db = await getDb();
  // Optimistic concurrency: reject when the learner state advanced while proposing (PRD-07 F02).
  const current = (await db.select({ v: schema.learners.stateVersion }).from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0];
  if (!current || current.v !== stateVersion) throw invalid("Your learning state changed while preparing the next activity. Reload to continue.");
  const open = await openAssignment(learnerId);
  if (open) return open; // duplicate guard
  const milestone = getMilestone(proposal.milestoneId);
  if (!milestone || milestone.status !== "published") throw invalid("The proposed milestone is not published.");
  if (proposal.item && proposal.item.status !== "published") throw invalid("The proposed item is not published.");
  const reasonCode = proposal.shortened && proposal.reasonCode !== "REDUCE_SUPPORT" ? proposal.reasonCode : proposal.reasonCode;
  let reasonText = REASON_TEXT[reasonCode];
  if (proposal.shortened && reasonCode !== "REDUCE_SUPPORT") reasonText += " " + REASON_TEXT.SHORT_SESSION;
  if (milestoneJustCompleted) reasonText = REASON_TEXT.MILESTONE_COMPLETE + " " + reasonText;
  const id = newId("asg");
  const [row] = await db.insert(schema.activityAssignments).values({
    id, learnerId, goalVersionId, activityType: proposal.activityType, milestoneId: proposal.milestoneId, capabilityId: proposal.capabilityId,
    lessonId: proposal.lesson?.id ?? null, lessonVersion: proposal.lesson?.version ?? null,
    itemId: proposal.item?.id ?? null, itemVersion: proposal.item?.version ?? null, itemFamily: proposal.item?.family ?? null,
    practiceId: proposal.practiceId ?? null, state: "assigned", reasonCode, reasonText, evidenceIds: proposal.evidenceIds,
    policyVersion: POLICY_VERSION, contentVersion: CONTENT_VERSION, contextBinding: null, resumePointer: null,
  }).returning();
  await recordPathRevision(learnerId, goalVersionId, reasonCode, reasonText, id, { evidenceIds: proposal.evidenceIds, capabilityId: proposal.capabilityId });
  await track("recommendation_created", learnerId, { reasonCode, capabilityId: proposal.capabilityId, activityType: proposal.activityType });
  return row;
}

/** Marks the open assignment complete (after evidence) and prepares the next one. */
export async function completeAssignment(learnerId: string, assignmentId: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.activityAssignments).set({ state: "completed", completedAt: clock.now() }).where(and(eq(schema.activityAssignments.id, assignmentId), eq(schema.activityAssignments.learnerId, learnerId)));
  await db.update(schema.learners).set({ stateVersion: (await currentStateVersion(learnerId)) + 1 }).where(eq(schema.learners.id, learnerId));
}

async function currentStateVersion(learnerId: string): Promise<number> {
  const db = await getDb();
  return (await db.select({ v: schema.learners.stateVersion }).from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]?.v ?? 1;
}

/** Invalidate personalised bindings after a fact correction; evidence is untouched (PRD-04 F05, PRD-10 F02). */
export async function invalidatePersonalisation(learnerId: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select().from(schema.activityAssignments).where(and(eq(schema.activityAssignments.learnerId, learnerId), inArray(schema.activityAssignments.state, ["assigned", "in_progress"])));
  for (const a of rows) {
    if (a.contextBinding) await db.update(schema.activityAssignments).set({ contextBinding: { ...a.contextBinding, invalidatedAt: clock.now().toISOString() } }).where(eq(schema.activityAssignments.id, a.id));
  }
}

// ---------------------------------------------------------------------------
// Activity rendering (S04/S05)
// ---------------------------------------------------------------------------

export type ActivityView = {
  assignment: {
    id: string; activityType: string; state: string; reasonCode: string; reasonText: string; milestoneId: string; milestoneTitle: string;
    capabilityId: string; capabilityTitle: string; goalInterpretation: string; goalDestination: string; resumePointer: { block: string } | null; contentVersion: string;
  };
  lesson: (Omit<Lesson, "bridges"> & { bridge: ContextBinding }) | null;
  item: PublicItem | null;
  practiceId: string | null;
  draft: { content: Record<string, unknown>; revision: number } | null;
  assistance: string[];
  workedAnswer: string | null;
  hintsRevealed: string[];
  latest: { attemptId: string; result: string; status: string; summary: string; mainGap: string | null; nextMove: string | null; criteria: Array<{ id: string; label: string; critical: boolean; status: string }>; assisted: boolean; evaluator: string } | null;
  attemptsOnItem: number;
  personalExamplesEnabled: boolean;
  next: { reasonCode: string; reasonText: string } | null;
};

export async function getAssignment(learnerId: string, assignmentId: string): Promise<Assignment> {
  const db = await getDb();
  const a = (await db.select().from(schema.activityAssignments).where(eq(schema.activityAssignments.id, assignmentId)).limit(1))[0];
  if (!a || a.learnerId !== learnerId) {
    await audit(learnerId, "read", "assignment", assignmentId, "denied");
    throw forbidden("That activity is not yours.");
  }
  return a;
}

export async function getActivityView(learnerId: string, assignmentId: string): Promise<ActivityView> {
  const db = await getDb();
  let a = await getAssignment(learnerId, assignmentId);
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  const goal = (await db.select().from(schema.goalVersions).where(eq(schema.goalVersions.id, a.goalVersionId)).limit(1))[0];
  if (a.state === "assigned") {
    await db.update(schema.activityAssignments).set({ state: "in_progress", startedAt: clock.now() }).where(eq(schema.activityAssignments.id, a.id));
    a = { ...a, state: "in_progress" };
    await track(a.activityType === "lesson" ? "lesson_started" : "next_activity_started", learnerId, { assignmentId: a.id, capabilityId: a.capabilityId, reasonCode: a.reasonCode });
  }
  const lesson = a.lessonId ? getCatalogue().lessons.find((l) => l.id === a.lessonId) ?? null : null;
  let binding = a.contextBinding;
  if (lesson && (!binding || binding.invalidatedAt || binding.profileVersion !== learner.profileVersion)) {
    binding = await bindContext(learnerId, lesson, learner.preferences, learner.profileVersion, binding?.mode === "general" && !binding.invalidatedAt ? "general" : undefined);
    await db.update(schema.activityAssignments).set({ contextBinding: binding }).where(eq(schema.activityAssignments.id, a.id));
  }
  const item = a.itemId ? getItem(a.itemId) ?? null : null;
  const draft = item ? (await db.select().from(schema.drafts).where(and(eq(schema.drafts.learnerId, learnerId), eq(schema.drafts.assignmentId, a.id), eq(schema.drafts.itemId, item.id))).limit(1))[0] : undefined;
  const assistance = item ? await db.select().from(schema.assistanceEvents).where(and(eq(schema.assistanceEvents.learnerId, learnerId), eq(schema.assistanceEvents.assignmentId, a.id))) : [];
  const kinds = assistance.map((x) => x.kind);
  const hintsRevealed = item ? item.hints.filter((_, i) => kinds.includes(`hint_${i + 1}`)) : [];
  const workedAnswer = item && (kinds.includes("worked_answer") || kinds.includes("tutor_solution")) ? item.key.workedAnswer : null;
  const attempts = item ? await db.select().from(schema.attempts).where(and(eq(schema.attempts.learnerId, learnerId), eq(schema.attempts.assignmentId, a.id), eq(schema.attempts.itemId, item.id))).orderBy(desc(schema.attempts.createdAt)) : [];
  let latest: ActivityView["latest"] = null;
  if (attempts[0]) {
    const ev = (await db.select().from(schema.evaluations).where(eq(schema.evaluations.attemptId, attempts[0].id)).orderBy(desc(schema.evaluations.createdAt)).limit(1))[0];
    if (ev) latest = { attemptId: attempts[0].id, result: ev.result, status: ev.status, summary: ev.summary, mainGap: ev.mainGap, nextMove: ev.nextMove, criteria: ev.criteria.map((c) => ({ id: c.id, label: c.label, critical: c.critical, status: c.status })), assisted: attempts[0].assisted, evaluator: ev.evaluator };
  }
  const milestone = getMilestone(a.milestoneId);
  const cap = getCapability(a.capabilityId);
  let next: ActivityView["next"] = null;
  if (a.state === "completed") {
    const open = await openAssignment(learnerId);
    if (open) next = { reasonCode: open.reasonCode, reasonText: open.reasonText };
  }
  return {
    assignment: {
      id: a.id, activityType: a.activityType, state: a.state, reasonCode: a.reasonCode, reasonText: a.reasonText, milestoneId: a.milestoneId, milestoneTitle: milestone?.title ?? "", capabilityId: a.capabilityId,
      capabilityTitle: cap?.title ?? "", goalInterpretation: goal?.interpretation ?? "", goalDestination: goal?.destination ?? "", resumePointer: a.resumePointer ?? null, contentVersion: a.contentVersion,
    },
    lesson: lesson ? { ...(({ bridges: _b, ...rest }) => { void _b; return rest; })(lesson), bridge: binding! } : null,
    item: item ? publicItem(item) : null,
    practiceId: a.practiceId ?? null,
    draft: draft ? { content: draft.content, revision: draft.revision } : null,
    assistance: kinds,
    workedAnswer, hintsRevealed,
    latest, attemptsOnItem: attempts.length,
    personalExamplesEnabled: learner.preferences.personalExamples,
    next,
  };
}

/** Selects and (in live mode) adapts the context bridge for a lesson (spec/04 §9, PRD-04 F02/F03). */
export async function bindContext(learnerId: string, lesson: Lesson, prefs: typeof schema.learners.$inferSelect.preferences, profileVersion: number, forceMode?: "general"): Promise<ContextBinding> {
  const general = lesson.bridges.find((b) => b.domain === "general")!;
  const facts = await eligibleFacts(learnerId, 5);
  const generalBinding = (source: ContextBinding["source"], note?: string): ContextBinding => ({
    mode: "general", factIds: [], domainKey: "general", label: "General example", source, promptVersion: null, profileVersion,
    blocks: [{ kind: "bridge", text: general.text }, ...(note ? [{ kind: "note" as const, text: note }] : [])], invalidatedAt: null,
  });
  if (forceMode === "general" || !prefs.personalExamples) return generalBinding("template");
  let chosen: Bridge | null = null;
  let usedFacts: PublicFact[] = [];
  if (prefs.exampleDomainOverride) {
    chosen = lesson.bridges.find((b) => b.domain === prefs.exampleDomainOverride) ?? null;
  }
  if (!chosen && facts.length > 0) {
    let best: { bridge: Bridge; score: number; facts: PublicFact[] } | null = null;
    for (const b of lesson.bridges) {
      if (b.domain === "general") continue;
      const matched = facts.filter((f) => b.keywords.some((k) => f.value.toLowerCase().includes(k.toLowerCase())) && (b.requiresFactTypes.length === 0 || b.requiresFactTypes.includes(f.factType)));
      if (matched.length > 0 && (!best || matched.length > best.score)) best = { bridge: b, score: matched.length, facts: matched };
    }
    if (best) { chosen = best.bridge; usedFacts = best.facts.slice(0, 2); }
  }
  if (!chosen) return generalBinding("template", facts.length === 0 ? "No personal context yet. Add a task or project you know well in Your profile to get examples from your own experience." : undefined);
  const label = usedFacts.length > 0 ? "Built from your experience; the scenario is imagined" : "Imagined scenario";
  const template: ContextBinding = {
    mode: "personal", factIds: usedFacts.map((f) => f.id), domainKey: chosen.domain, label, source: "template", promptVersion: null, profileVersion,
    blocks: [{ kind: "bridge", text: chosen.text }, ...(chosen.analogyLimit ? [{ kind: "note" as const, text: `Limit of the analogy: ${chosen.analogyLimit}` }] : [])], invalidatedAt: null,
  };
  if (gatewayMode() !== "live" || usedFacts.length === 0) return { ...template, source: gatewayMode() === "live" ? "template" : "fixture" };
  try {
    const concept = lesson.blocks.find((b) => b.type === "concept");
    const r = await runTask("adapt_lesson", {
      lessonTitle: lesson.title, conceptStatement: concept && concept.type === "concept" ? concept.text : lesson.outcome, templateBridge: chosen.text,
      facts: usedFacts.map((f) => ({ id: f.id, factType: f.factType, value: f.value })), goalInterpretation: lesson.outcome, depth: lesson.depth,
    }, { learnerId });
    const out = r.output;
    const permitted = new Set(usedFacts.map((f) => f.id));
    const valid = out.factIdsUsed.every((id) => permitted.has(id)) && out.bridge.length > 20 && out.unsupportedDetailWarnings.length === 0 && (out.scenarioLabel === "imagined" || usedFacts.length > 0);
    if (!valid) return { ...template, blocks: [...template.blocks!, { kind: "note", text: "The personal example could not be validated, so a reviewed version is shown instead." }] };
    return {
      ...template, source: "live", promptVersion: r.promptVersion, factIds: out.factIdsUsed,
      blocks: [{ kind: "bridge", text: out.bridge }, ...(out.analogyLimit ? [{ kind: "note" as const, text: `Limit of the analogy: ${out.analogyLimit}` }] : chosen.analogyLimit ? [{ kind: "note" as const, text: `Limit of the analogy: ${chosen.analogyLimit}` }] : [])],
    };
  } catch (err) {
    if (err instanceof GatewayError) {
      return { ...template, blocks: [...template.blocks!, { kind: "note", text: "The personal example could not be prepared yet; a reviewed version is shown instead." }] };
    }
    throw err;
  }
}

/** "This example does not fit me" (PRD-04 F05). */
export async function rejectExample(learnerId: string, assignmentId: string, scope: "this_lesson" | "all"): Promise<void> {
  const db = await getDb();
  const a = await getAssignment(learnerId, assignmentId);
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  if (scope === "all") await db.update(schema.learners).set({ preferences: { ...learner.preferences, personalExamples: false } }).where(eq(schema.learners.id, learnerId));
  const lesson = a.lessonId ? getCatalogue().lessons.find((l) => l.id === a.lessonId) : null;
  if (lesson) {
    const binding = await bindContext(learnerId, lesson, { ...learner.preferences, personalExamples: scope === "all" ? false : learner.preferences.personalExamples }, learner.profileVersion, "general");
    await db.update(schema.activityAssignments).set({ contextBinding: binding }).where(eq(schema.activityAssignments.id, a.id));
  }
  await track("context_example_rejected", learnerId, { assignmentId, scope });
}

export async function recordAssistance(learnerId: string, assignmentId: string, kind: string): Promise<void> {
  const db = await getDb();
  const a = await getAssignment(learnerId, assignmentId);
  await db.insert(schema.assistanceEvents).values({ id: newId("ast"), learnerId, assignmentId: a.id, itemId: a.itemId ?? null, kind });
  await track(kind.startsWith("hint") ? "hint_requested" : "explanation_changed", learnerId, { assignmentId, kind });
}

/** Lesson exposure completion: introduced, never demonstrated (PRD-04 F06). */
export async function markExposureComplete(learnerId: string, assignmentId: string): Promise<void> {
  const db = await getDb();
  const a = await getAssignment(learnerId, assignmentId);
  if (a.activityType !== "lesson") return;
  await db.update(schema.activityAssignments).set({ exposureCompletedAt: clock.now() }).where(eq(schema.activityAssignments.id, a.id));
  await track("lesson_exposure_completed", learnerId, { assignmentId });
}

/** Continue past a lesson without an assessed task: the lesson closes as exposure and the check becomes the next activity. */
export async function continueWithoutTask(learnerId: string, assignmentId: string): Promise<NextActivity> {
  const a = await getAssignment(learnerId, assignmentId);
  await markExposureComplete(learnerId, assignmentId);
  await completeAssignment(learnerId, a.id);
  await recomputeProjection(learnerId, a.capabilityId);
  return computeNextActivity(learnerId);
}

/** "I know this": offer a fresh independent check (PRD-03 F05). Viewing content never demonstrates. */
export async function claimKnown(learnerId: string, assignmentId: string): Promise<NextActivity> {
  const db = await getDb();
  const a = await getAssignment(learnerId, assignmentId);
  const attempted = await familiesAttempted(learnerId, a.capabilityId);
  const items = getItemsForCapability(a.capabilityId).filter((i) => ["check", "transfer"].includes(i.taskKind) && !attempted.has(i.family) && i.family !== a.itemFamily);
  const item = items.find((i) => i.taskKind === "transfer") ?? items[0];
  if (!item) throw invalid("No fresh check is available for this capability yet. Continue with the current task instead.");
  await markExposureComplete(learnerId, assignmentId);
  await db.update(schema.activityAssignments).set({ state: "completed", completedAt: clock.now() }).where(eq(schema.activityAssignments.id, a.id));
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  await recomputeProjection(learnerId, a.capabilityId);
  const assignment = await commitProposal(learnerId, a.goalVersionId, { activityType: item.taskKind === "transfer" ? "transfer" : "check", milestoneId: a.milestoneId, capabilityId: a.capabilityId, item, reasonCode: "LEARNER_CLAIM_CHECK", evidenceIds: [] }, learner.stateVersion, false);
  return { assignment, reasonCode: "LEARNER_CLAIM_CHECK", reasonText: REASON_TEXT.LEARNER_CLAIM_CHECK, coverageNote: null };
}

export async function saveDraft(learnerId: string, assignmentId: string, itemId: string, content: Record<string, unknown>, clientRevision: number): Promise<{ revision: number; conflict: boolean; server?: Record<string, unknown> }> {
  const db = await getDb();
  const a = await getAssignment(learnerId, assignmentId);
  if (a.itemId !== itemId) throw invalid("That task is not part of this activity.");
  const existing = (await db.select().from(schema.drafts).where(and(eq(schema.drafts.learnerId, learnerId), eq(schema.drafts.assignmentId, assignmentId), eq(schema.drafts.itemId, itemId))).limit(1))[0];
  const safe = sanitiseDraft(content);
  if (!existing) {
    await db.insert(schema.drafts).values({ id: newId("drf"), learnerId, assignmentId, itemId, content: safe, revision: 1, contentVersion: a.contentVersion, updatedAt: clock.now() });
    await db.update(schema.activityAssignments).set({ resumePointer: { block: "task" } }).where(eq(schema.activityAssignments.id, assignmentId));
    return { revision: 1, conflict: false };
  }
  if (clientRevision < existing.revision) return { revision: existing.revision, conflict: true, server: existing.content };
  const revision = existing.revision + 1;
  await db.update(schema.drafts).set({ content: safe, revision, updatedAt: clock.now() }).where(eq(schema.drafts.id, existing.id));
  return { revision, conflict: false };
}

function sanitiseDraft(content: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(content)) {
    if (typeof v === "string") out[k] = v.slice(0, 12_000);
    else if (Array.isArray(v)) out[k] = v.slice(0, 20).map((x) => (typeof x === "string" ? x.slice(0, 200) : x));
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

export async function saveResumePointer(learnerId: string, assignmentId: string, block: string): Promise<void> {
  const db = await getDb();
  await getAssignment(learnerId, assignmentId);
  await db.update(schema.activityAssignments).set({ resumePointer: { block: block.slice(0, 40) } }).where(eq(schema.activityAssignments.id, assignmentId));
}

// ---------------------------------------------------------------------------
// Today and My path
// ---------------------------------------------------------------------------

export type TodayView = {
  variant: "no_goal" | "first_lesson" | "active_draft" | "next_ready" | "review_due" | "milestone_complete" | "goal_complete" | "content_unavailable" | "returning";
  goal: { interpretation: string; destination: string; originalText: string } | null;
  next: { assignmentId: string; title: string; capabilityTitle: string; reasonCode: string; reasonText: string; minutes: [number, number]; activityType: string; milestoneTitle: string } | null;
  review: { capabilityTitle: string; dueAt: string } | null;
  achievement: { text: string; artefactId: string | null } | null;
  coverageNote: string | null;
  sessionMinutes: number;
  awayDays: number;
};

export async function getToday(learnerId: string): Promise<TodayView> {
  const db = await getDb();
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  const goal = (await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active"))).limit(1))[0];
  const lastAttempt = (await db.select({ at: schema.attempts.createdAt }).from(schema.attempts).where(eq(schema.attempts.learnerId, learnerId)).orderBy(desc(schema.attempts.createdAt)).limit(1))[0];
  const awayDays = lastAttempt ? Math.floor((clock.now().getTime() - lastAttempt.at.getTime()) / 86400_000) : 0;
  if (!goal) return { variant: "no_goal", goal: null, next: null, review: null, achievement: null, coverageNote: null, sessionMinutes: learner.preferences.sessionMinutes, awayDays };
  const next = await computeNextActivity(learnerId);
  const projections = await getProjections(learnerId);
  const dueReview = projections.filter((p) => p.state === "needs_review" && goal.targetCapabilityIds.includes(p.capabilityId)).sort((a, b) => (a.reviewDueAt?.getTime() ?? 0) - (b.reviewDueAt?.getTime() ?? 0))[0];
  const lastArtefact = (await db.select().from(schema.artefactVersions).where(and(eq(schema.artefactVersions.learnerId, learnerId), eq(schema.artefactVersions.isDraft, false))).orderBy(desc(schema.artefactVersions.createdAt)).limit(1))[0];
  const demonstrated = projections.filter((p) => p.state === "demonstrated" || p.state === "needs_review").sort((a, b) => (b.demonstratedAt?.getTime() ?? 0) - (a.demonstratedAt?.getTime() ?? 0))[0];
  const achievement = demonstrated
    ? { text: `You demonstrated “${getCapability(demonstrated.capabilityId)?.title ?? demonstrated.capabilityId}”${demonstrated.transferPassed ? " including a transfer task" : ""}.`, artefactId: lastArtefact?.id ?? null }
    : lastArtefact ? { text: `You saved “${lastArtefact.title}”.`, artefactId: lastArtefact.id } : null;
  let variant: TodayView["variant"] = "next_ready";
  const a = next.assignment;
  if (!a) variant = next.reasonCode === "GOAL_COMPLETE" ? "goal_complete" : "content_unavailable";
  else if (a.activityType === "review") variant = "review_due";
  else if (a.state === "in_progress") variant = "active_draft";
  else if (a.reasonCode === "TEACH_FIRST" && projections.length === 0) variant = "first_lesson";
  else if (a.reasonText.startsWith(REASON_TEXT.MILESTONE_COMPLETE)) variant = "milestone_complete";
  if (awayDays >= 14 && variant === "next_ready") variant = "returning";
  let nextView: TodayView["next"] = null;
  if (a) {
    const lesson = a.lessonId ? getCatalogue().lessons.find((l) => l.id === a.lessonId) : null;
    const item = a.itemId ? getItem(a.itemId) : null;
    const practice = a.practiceId ? getCatalogue().practices.find((p) => p.id === a.practiceId) : null;
    const minutes: [number, number] = lesson ? lesson.durationMinutes : item ? [Math.max(2, item.estimatedMinutes - 2), item.estimatedMinutes + 3] : [10, 15];
    nextView = {
      assignmentId: a.id, title: lesson?.title ?? item?.title ?? practice?.title ?? "Next activity", capabilityTitle: getCapability(a.capabilityId)?.title ?? "",
      reasonCode: a.reasonCode, reasonText: a.reasonText, minutes, activityType: a.activityType, milestoneTitle: getMilestone(a.milestoneId)?.title ?? "",
    };
  }
  return {
    variant, goal: { interpretation: goal.interpretation, destination: goal.destination, originalText: goal.originalText }, next: nextView,
    review: dueReview && a?.activityType !== "review" ? { capabilityTitle: getCapability(dueReview.capabilityId)?.title ?? "", dueAt: dueReview.reviewDueAt?.toISOString() ?? "" } : null,
    achievement, coverageNote: next.coverageNote, sessionMinutes: learner.preferences.sessionMinutes, awayDays,
  };
}

export type PathView = {
  goal: { id: string; interpretation: string; destination: string; originalText: string; provisional: boolean } | null;
  sessionMinutes: number;
  milestones: Array<{
    id: string; title: string; outcome: string; evidenceRequirement: string; whyIncluded: string; outputDescription: string; status: "published" | "planned"; optional: boolean;
    label: "Ready" | "In progress" | "Demonstrated" | "Review due" | "Planned" | "Optional depth";
    capabilities: Array<{ id: string; title: string; state: string; reason: string; prerequisites: string[]; evidenceIds: string[]; available: boolean }>;
    demonstratedCount: number;
    estimatedSessions: string | null;
  }>;
  revisions: Array<{ id: string; reasonCode: string; reasonText: string; createdAt: string }>;
  coverageNote: string | null;
};

export async function getPath(learnerId: string): Promise<PathView> {
  const db = await getDb();
  const learner = (await db.select().from(schema.learners).where(eq(schema.learners.id, learnerId)).limit(1))[0]!;
  const goal = (await db.select().from(schema.goalVersions).where(and(eq(schema.goalVersions.learnerId, learnerId), eq(schema.goalVersions.status, "active"))).limit(1))[0];
  if (!goal) return { goal: null, sessionMinutes: learner.preferences.sessionMinutes, milestones: [], revisions: [], coverageNote: null };
  const projections = await getProjections(learnerId);
  const projByCap = new Map(projections.map((p) => [p.capabilityId, p]));
  const open = await openAssignment(learnerId);
  const cat = getCatalogue();
  const milestones = goal.milestoneIds.map((id) => cat.effectiveMilestones.find((m) => m.id === id)).filter((m): m is Milestone => Boolean(m)).map((m) => {
    const caps = m.capabilityIds.map((cid) => {
      const cap = getCapability(cid)!;
      const p = projByCap.get(cid);
      return { id: cid, title: cap.title, state: p?.state ?? "unknown", reason: p?.reason ?? "No evidence yet.", prerequisites: cap.prerequisites, evidenceIds: p?.supportingEvidenceIds ?? [], available: isCapabilityAvailable(cid) };
    });
    const demonstratedCount = caps.filter((c) => c.state === "demonstrated" || c.state === "needs_review").length;
    let label: PathView["milestones"][number]["label"];
    if (m.status === "planned") label = "Planned";
    else if (m.optional && demonstratedCount === 0 && !caps.some((c) => c.state !== "unknown")) label = "Optional depth";
    else if (demonstratedCount === caps.length) label = caps.some((c) => c.state === "needs_review") ? "Review due" : "Demonstrated";
    else if (caps.some((c) => c.state !== "unknown") || open?.milestoneId === m.id) label = "In progress";
    else label = "Ready";
    return { id: m.id, title: m.title, outcome: m.outcome, evidenceRequirement: m.evidenceRequirement, whyIncluded: m.whyIncluded, outputDescription: m.outputDescription, status: m.status, optional: m.optional, label, capabilities: caps, demonstratedCount, estimatedSessions: m.estimatedSessions ?? null };
  });
  const revisions = await db.select().from(schema.pathRevisions).where(eq(schema.pathRevisions.learnerId, learnerId)).orderBy(desc(schema.pathRevisions.createdAt)).limit(8);
  return {
    goal: { id: goal.id, interpretation: goal.interpretation, destination: goal.destination, originalText: goal.originalText, provisional: goal.provisional },
    sessionMinutes: learner.preferences.sessionMinutes, milestones,
    revisions: revisions.map((r) => ({ id: r.id, reasonCode: r.reasonCode, reasonText: r.reasonText, createdAt: r.createdAt.toISOString() })),
    coverageNote: goal.coverage.gapNote,
  };
}

/** Preview any published activity without awarding anything (PRD-03 F05). */
export function previewCapability(capabilityId: string): { lesson: Omit<Lesson, "bridges"> | null; available: boolean } {
  const lesson = getLessonForCapability(capabilityId);
  if (!lesson) return { lesson: null, available: false };
  const { bridges: _b, ...rest } = lesson;
  void _b;
  return { lesson: rest, available: isCapabilityAvailable(capabilityId) };
}

export { REASON_TEXT };
