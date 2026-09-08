import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { clarifyGoal } from "@/server/services/goals";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ answer: z.string().nullable() }));
  return clarifyGoal(requireLearner(identity).learnerId, params.id, body.answer);
});
