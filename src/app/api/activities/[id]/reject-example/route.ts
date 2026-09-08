import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { rejectExample } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ scope: z.enum(["this_lesson", "all"]) }));
  await rejectExample(requireLearner(identity).learnerId, params.id, body.scope);
  return { ok: true };
});
