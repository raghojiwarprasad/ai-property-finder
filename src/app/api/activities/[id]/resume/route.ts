import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { saveResumePointer } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const PUT = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ block: z.string() }));
  await saveResumePointer(requireLearner(identity).learnerId, params.id, body.block);
  return { ok: true };
});
