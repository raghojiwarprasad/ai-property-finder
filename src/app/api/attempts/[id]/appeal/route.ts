import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { appealAttempt } from "@/server/services/assessment";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ reason: z.string() }));
  return appealAttempt(requireLearner(identity).learnerId, params.id, body.reason);
});
