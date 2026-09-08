import { describe, it, expect } from "vitest";
import { getPractice } from "@/content";
import { simulate, runPractice, submitPractice } from "@/server/services/practice";
import { learnerWithGoal, newGuest, withFreshDb, STRONG_F04, STRONG_TRAVEL } from "./helpers";
import { computeNextActivity, getActivityView, getProjections, recordAssistance } from "@/server/services/learning";
import { submitAttempt } from "@/server/services/assessment";

withFreshDb();

describe("deterministic simulations (PRD-08)", () => {
  const approval = getPractice("PRC-F09-approval-boundary")!;
  const retrieval = getPractice("PRC-F06-retrieval-explorer")!;

  it("P08-AC02: a permissive configuration pays invoices a person should have seen, as a fictional outcome with zero external actions", () => {
    const o = simulate(approval, "day_one", { autoPayLimit: 50000, newSupplierAuto: true, minConfidence: 0, unsureAction: "pay", duplicateCheck: false });
    expect(o.result).toBe("fail");
    expect(o.unsafeActions).toBeGreaterThan(0);
    expect(o.trace.every((t) => /simulated|fictional|no real|no money/i.test(t.outcome) || t.flag === "info")).toBe(true);
    expect(o.criteria.find((c) => c.id === "A1")!.status).toBe("not_met");
  });

  it("a considered boundary passes while routine invoices still flow", () => {
    const o = simulate(approval, "day_one", { autoPayLimit: 5000, newSupplierAuto: false, minConfidence: 0.8, unsureAction: "hold", duplicateCheck: true });
    expect(o.result).toBe("pass");
    expect(o.heldRoutine).toBeLessThanOrEqual(1);
    const over = simulate(approval, "day_one", { autoPayLimit: 0, newSupplierAuto: false, minConfidence: 1, unsureAction: "hold", duplicateCheck: true });
    expect(over.result).toBe("fail"); // holding everything is over-restriction (A2)
    expect(over.summary).toMatch(/held too/);
  });

  it("P08-AC01: the retrieval trace shows what was retrieved and names the failure", () => {
    const bad = simulate(retrieval, "refund_window", { passages: ["P1", "P2"], unknownRule: "best_guess", citeSources: true });
    expect(bad.result).toBe("fail");
    expect(bad.trace.some((t) => t.action === "Retrieved" && /different situation/.test(t.outcome))).toBe(true);
    expect(bad.summary).toMatch(/different situation/);
    const good = simulate(retrieval, "refund_window", { passages: ["P3"], unknownRule: "decline", citeSources: true });
    expect(good.result).toBe("pass");
  });

  it("P08-AC03/AC04: running the default proves nothing; submission needs a decision; hints mark the attempt assisted", async () => {
    const learnerId = await newGuest();
    const run = await runPractice(learnerId, { practiceId: approval.id, scenarioKey: "day_one", configuration: {} });
    expect(run.outcome.result).toBe("fail");
    // Bring a learner to the F09 practice through MD2 (build goal after MD1 would take long); assign directly via the builder path is not needed:
    // create a learner whose goal includes MD2 and walk to the practice assignment by demonstrating prerequisites is out of scope for a unit test,
    // so exercise submitPractice's rules with a synthetic practice assignment.
    const { learnerId: l2, assignmentId } = await learnerWithGoal();
    const db = await (await import("@/server/db")).getDb();
    const { schema } = await import("@/server/db");
    const { eq } = await import("drizzle-orm");
    await db.update(schema.activityAssignments).set({ activityType: "practice", practiceId: approval.id, capabilityId: "F09", itemId: null, lessonId: null, milestoneId: "MA2" }).where(eq(schema.activityAssignments.id, assignmentId));
    const r1 = await runPractice(l2, { practiceId: approval.id, scenarioKey: "day_one", configuration: { autoPayLimit: 5000, newSupplierAuto: false, minConfidence: 0.8, unsureAction: "hold", duplicateCheck: true }, assignmentId });
    await expect(submitPractice(l2, { assignmentId, runId: r1.runId, explanation: "ok", idempotencyKey: "p-0" })).rejects.toMatchObject({ status: 400 });
    await recordAssistance(l2, assignmentId, "hint_1");
    await recordAssistance(l2, assignmentId, "hint_2");
    const s = await submitPractice(l2, { assignmentId, runId: r1.runId, explanation: "New suppliers and low-confidence matches need a person; holding on uncertainty costs time, paying costs money.", idempotencyKey: "p-1" });
    expect(s.result).toBe("pass");
    expect(s.assisted).toBe(true);
    expect(s.independent).toBe(false);
    const again = await submitPractice(l2, { assignmentId, runId: r1.runId, explanation: "same", idempotencyKey: "p-1" });
    expect(again.replayed).toBe(true);
    const proj = (await getProjections(l2)).find((p) => p.capabilityId === "F09")!;
    expect(proj.state).toBe("practising");
    expect(proj.artefactPassed).toBe(false);
  });

  it("the policy reaches the F09 simulation for a practical-use learner after MA1", async () => {
    const { learnerId, assignmentId } = await learnerWithGoal();
    const answers: Record<string, string> = { supplier_claims: STRONG_F04, travel_claims: STRONG_TRAVEL };
    let id: string | null = assignmentId;
    let guard = 0;
    while (id && guard < 40) {
      guard += 1;
      const v = await getActivityView(learnerId, id);
      if (v.practiceId) break;
      const item = v.item!;
      let submission: Record<string, unknown>;
      if (item.prompt.kind === "selected") {
        const key = (await import("@/content")).getItemByFamily(item.family)!.key.correctOptionIds![0];
        submission = { optionId: key };
      } else if (item.prompt.kind === "written") {
        submission = { text: answers[item.family] ?? (await import("@/content")).getItemByFamily(item.family)!.key.evaluationCases.find((c) => c.expected === "pass")!.submission };
      } else {
        const strong = (await import("@/content")).getItemByFamily(item.family)!.key.evaluationCases.find((c) => c.expected === "pass")!.submission;
        submission = Object.fromEntries(item.prompt.fields.map((f, i) => [f.id, i === 0 ? strong : "see above"]));
      }
      const r = await submitAttempt(learnerId, { assignmentId: id, itemId: item.id, itemVersion: item.version, submission, idempotencyKey: `walk-${guard}` });
      expect(r.evaluation.status, `${item.family}`).toBe("final");
      id = r.next?.assignmentId ?? (await computeNextActivity(learnerId)).assignment?.id ?? null;
    }
    const v = await getActivityView(learnerId, id!);
    expect(v.practiceId).toBe("PRC-F09-approval-boundary");
    expect(v.assignment.reasonCode).toBe("PRACTICE_SIMULATION");
    const states = await getProjections(learnerId);
    expect(states.filter((p) => p.state === "demonstrated").map((p) => p.capabilityId)).toEqual(expect.arrayContaining(["F04", "F02", "F03", "F06"]));
  });
});
