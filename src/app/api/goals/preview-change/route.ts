import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { previewGoalChange } from "@/server/services/goals";
import { Destination } from "@/content/types";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req }) => {
  const body = await readJson(req, z.object({ destination: Destination }));
  return previewGoalChange(requireLearner(identity).learnerId, body.destination);
});
