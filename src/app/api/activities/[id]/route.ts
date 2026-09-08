import { handler, requireLearner } from "@/server/lib/api";
import { getActivityView } from "@/server/services/learning";

export const dynamic = "force-dynamic";

/** GET /api/activities/:id: task and lesson content excluding hidden answers. */
export const GET = handler({}, async ({ identity, params }) => getActivityView(requireLearner(identity).learnerId, params.id));
