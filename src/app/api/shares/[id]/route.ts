import { handler, requireLearner } from "@/server/lib/api";
import { revokeShare } from "@/server/services/sharing";

export const dynamic = "force-dynamic";

export const DELETE = handler({ write: true }, async ({ identity, params }) => {
  await revokeShare(requireLearner(identity).learnerId, params.id);
  return { ok: true };
});
