import { handler, requireLearner } from "@/server/lib/api";
import { cancelUpload } from "@/server/services/experience";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true }, async ({ identity, params }) => cancelUpload(requireLearner(identity).learnerId, params.id));
