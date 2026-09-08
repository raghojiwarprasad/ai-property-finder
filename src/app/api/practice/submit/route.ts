import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { submitPractice } from "@/server/services/practice";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req }) => {
  const body = await readJson(req, z.object({ assignmentId: z.string(), runId: z.string(), explanation: z.string(), idempotencyKey: z.string().min(8).max(120) }));
  return submitPractice(requireLearner(identity).learnerId, body);
});
