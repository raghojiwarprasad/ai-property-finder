import { beforeAll, afterAll, beforeEach } from "vitest";
import { getDb, resetDbForTests } from "@/server/db";
import { createGuestSession } from "@/server/services/identity";
import { saveManualContext } from "@/server/services/experience";
import { activateGoal, interpretGoal } from "@/server/services/goals";
import { clock } from "@/server/lib/util";
import { resetRateLimitsForTests } from "@/server/lib/rateLimit";

process.env.PGLITE_DIR = "memory://";
process.env.AI_MODE = process.env.AI_MODE ?? "fixture";
process.env.UPLOAD_DIR = "/tmp/claude-0/-home-user-ai-property-finder/8464a29f-eb72-552b-9711-5b9952e0b051/scratchpad/uploads-test";

/** Fresh in-memory database for each test file. */
export function withFreshDb() {
  beforeAll(async () => { await resetDbForTests(); await getDb(); });
  beforeEach(() => { clock.offsetMs = 0; resetRateLimitsForTests(); });
  afterAll(async () => { await resetDbForTests(); });
}

export async function newGuest() {
  const { identity } = await createGuestSession();
  return identity.learnerId;
}

/** Guest with the UC01 fixture context and an activated goal; returns the first assignment id. */
export async function learnerWithGoal(goalText = "Use AI confidently in operations work", context = "Coordinated suppliers and compared bids for construction projects. Tracked purchase orders and delivery delays.") {
  const learnerId = await newGuest();
  if (context) await saveManualContext(learnerId, context);
  const proposal = await interpretGoal(learnerId, goalText);
  const r = await activateGoal(learnerId, proposal.goalVersionId);
  return { learnerId, goalVersionId: proposal.goalVersionId, assignmentId: r.assignmentId! };
}

export const STRONG_F04 = "The word guaranteed is invented: Elm only estimates 12–15 business days after order confirmation and Oak says 10 days subject to stock. 'Within 12 days' also narrows the range to its lower bound. Corrected: Elm estimates 12–15 business days after confirmation; Oak offers 10 business days subject to stock; neither guarantees delivery. Instruction: only use the supplied quotes and say 'not stated' when the sources do not contain an answer.";
export const WRONG_F04 = "The answer is good and clearly written. Elm guarantees delivery within 12 days, which is faster than Oak, so the recommendation to choose Elm is correct and well supported.";
export const STRONG_TRAVEL = "Three unsupported claims: it is not free (fee of 60), not any time (24 hours before, subject to seat availability), and Heron refunds are only for airline cancellations, not always available. Corrected summary keeps those conditions. Instruction: only use the policies and say not stated if a question is not covered.";
