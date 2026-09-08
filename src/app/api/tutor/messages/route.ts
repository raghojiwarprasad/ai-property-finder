import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { sendMessage } from "@/server/services/tutor";

export const dynamic = "force-dynamic";

/** POST /api/tutor/messages: save the learner's message, then produce (or fail honestly) a tutor response. */
export const POST = handler({ write: true, rateLimit: { key: "tutor", limit: 40, windowMs: 600_000 } }, async ({ identity, req }) => {
  const body = await readJson(req, z.object({ assignmentId: z.string(), question: z.string(), selection: z.string().nullable().optional(), blockId: z.string().nullable().optional(), requestKey: z.string().min(8).max(120), explicitSolutionRequest: z.boolean().optional() }));
  return sendMessage(requireLearner(identity).learnerId, body);
});
