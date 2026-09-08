import { handler, requireLearner } from "@/server/lib/api";
import { getThread } from "@/server/services/tutor";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity, params }) => ({ messages: await getThread(requireLearner(identity).learnerId, params.assignmentId) }));
