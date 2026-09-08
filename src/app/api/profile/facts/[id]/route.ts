import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { updateFact } from "@/server/services/experience";
import { flagSharesForFact } from "@/server/services/sharing";

export const dynamic = "force-dynamic";

/** PATCH /api/profile/facts/:id: correct, confirm or remove an owned fact with a profile-version precondition. */
export const PATCH = handler({ write: true }, async ({ identity, req, params }) => {
  const learner = requireLearner(identity);
  const body = await readJson(req, z.object({ value: z.string().optional(), remove: z.boolean().optional(), confirm: z.boolean().optional(), expectedProfileVersion: z.number().int().optional(), previousValue: z.string().optional() }));
  const fact = await updateFact(learner.learnerId, params.id, body);
  let flaggedShares = 0;
  if ((body.remove || body.value) && body.previousValue) flaggedShares = await flagSharesForFact(learner.learnerId, body.previousValue);
  return { fact, flaggedShares };
});
