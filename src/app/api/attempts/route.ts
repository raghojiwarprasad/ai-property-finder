import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { submitAttempt } from "@/server/services/assessment";

export const dynamic = "force-dynamic";

/** POST /api/attempts: persist an immutable attempt (idempotent) and return the evaluation state. */
export const POST = handler({ write: true, rateLimit: { key: "attempts", limit: 60, windowMs: 600_000 } }, async ({ identity, req }) => {
  const body = await readJson(req, z.object({
    assignmentId: z.string(), itemId: z.string(), itemVersion: z.number().int(), submission: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(8).max(120), confidence: z.enum(["sure", "unsure"]).nullable().optional(),
  }));
  return submitAttempt(requireLearner(identity).learnerId, body);
});
