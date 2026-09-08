import { handler, requireLearner } from "@/server/lib/api";
import { getWork } from "@/server/services/work";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity, params }) => getWork(requireLearner(identity).learnerId, params.id));
