import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { reportMessage } from "@/server/services/tutor";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req, params }) => {
  const body = await readJson(req, z.object({ description: z.string().optional() }));
  await reportMessage(requireLearner(identity).learnerId, params.id, body.description ?? "");
  return { ok: true };
});
