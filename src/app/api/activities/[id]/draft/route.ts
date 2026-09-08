import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { saveDraft } from "@/server/services/learning";

export const dynamic = "force-dynamic";

/** PUT /api/activities/:id/draft: save with client revision and conflict handling. */
export const PUT = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ itemId: z.string(), content: z.record(z.string(), z.unknown()), revision: z.number().int().min(0) }));
  return saveDraft(requireLearner(identity).learnerId, params.id, body.itemId, body.content, body.revision);
});
