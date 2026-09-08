import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { goalHistory, interpretGoal } from "@/server/services/goals";

export const dynamic = "force-dynamic";

/** POST /api/goals: interpret a goal; returns coverage and the proposed first milestone. */
export const POST = handler({ write: true, createGuest: true, rateLimit: { key: "goals", limit: 30, windowMs: 600_000 } }, async ({ identity, req }) => {
  const learner = requireLearner(identity);
  const body = await readJson(req, z.object({ text: z.string(), sessionMinutes: z.union([z.literal(10), z.literal(20), z.literal(40)]).optional() }));
  return interpretGoal(learner.learnerId, body.text, { sessionMinutes: body.sessionMinutes });
});

export const GET = handler({}, async ({ identity }) => ({ goals: identity ? await goalHistory(identity.learnerId) : [] }));
