import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { previewShare } from "@/server/services/sharing";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, req }) => {
  const body = await readJson(req, z.union([z.object({ kind: z.literal("challenge"), family: z.string() }), z.object({ kind: z.literal("work"), artefactId: z.string() })]));
  return previewShare(requireLearner(identity).learnerId, body);
});
