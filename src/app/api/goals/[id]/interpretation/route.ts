import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { editInterpretation } from "@/server/services/goals";

export const dynamic = "force-dynamic";

export const PATCH = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ interpretation: z.string() }));
  return editInterpretation(requireLearner(identity).learnerId, params.id, body.interpretation);
});
