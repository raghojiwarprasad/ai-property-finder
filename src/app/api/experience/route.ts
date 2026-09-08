import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { listFacts, saveManualContext } from "@/server/services/experience";

export const dynamic = "force-dynamic";

/** POST /api/experience: save a manual description. GET: list active facts. */
export const POST = handler({ write: true, createGuest: true, rateLimit: { key: "experience", limit: 20, windowMs: 600_000 } }, async ({ identity, req }) => {
  const learner = requireLearner(identity);
  const body = await readJson(req, z.object({ text: z.string() }));
  return saveManualContext(learner.learnerId, body.text);
});

export const GET = handler({}, async ({ identity }) => ({ facts: identity ? await listFacts(identity.learnerId) : [] }));
