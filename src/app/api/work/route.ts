import { handler, requireLearner } from "@/server/lib/api";
import { listWork } from "@/server/services/work";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity }) => ({ items: await listWork(requireLearner(identity).learnerId) }));
