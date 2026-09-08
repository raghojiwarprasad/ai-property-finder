import { handler, requireLearner } from "@/server/lib/api";
import { getToday } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity }) => getToday(requireLearner(identity).learnerId));
