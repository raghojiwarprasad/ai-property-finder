import { handler, requireLearner } from "@/server/lib/api";
import { activateGoal } from "@/server/services/goals";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, params }) => activateGoal(requireLearner(identity).learnerId, params.id));
