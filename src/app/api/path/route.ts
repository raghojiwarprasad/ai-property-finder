import { handler, requireLearner } from "@/server/lib/api";
import { getPath } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity }) => getPath(requireLearner(identity).learnerId));
