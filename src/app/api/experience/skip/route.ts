import { handler, requireLearner } from "@/server/lib/api";
import { skipContext } from "@/server/services/experience";

export const dynamic = "force-dynamic";

export const POST = handler({ write: true, createGuest: true }, async ({ identity }) => {
  await skipContext(requireLearner(identity).learnerId);
  return { ok: true };
});
