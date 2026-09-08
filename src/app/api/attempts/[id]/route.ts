import { handler, requireLearner } from "@/server/lib/api";
import { getAttempt } from "@/server/services/assessment";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity, params }) => getAttempt(requireLearner(identity).learnerId, params.id));
