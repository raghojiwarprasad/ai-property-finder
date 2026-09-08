import { handler, requireLearner } from "@/server/lib/api";
import { continueWithoutTask } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, params }) => {
  const next = await continueWithoutTask(requireLearner(identity).learnerId, params.id);
  return { assignmentId: next.assignment?.id ?? null, reasonCode: next.reasonCode, reasonText: next.reasonText };
});
