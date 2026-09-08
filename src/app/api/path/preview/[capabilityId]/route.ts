import { handler } from "@/server/lib/api";
import { previewCapability } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ params }) => previewCapability(params.capabilityId));
