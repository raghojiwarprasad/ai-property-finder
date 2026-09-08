import { handler, requireLearner } from "@/server/lib/api";
import { getUploadStatus } from "@/server/services/experience";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity, params }) => getUploadStatus(requireLearner(identity).learnerId, params.id));
