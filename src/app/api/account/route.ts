import { handler, requireLearner } from "@/server/lib/api";
import { deleteAccount } from "@/server/services/privacy";
import { clearCookies } from "@/server/lib/session";

export const dynamic = "force-dynamic";

/** DELETE /api/account: revoke access immediately and run the deletion job. */
export const DELETE = handler({ write: true }, async ({ identity }) => {
  const learner = requireLearner(identity);
  const r = await deleteAccount(learner.learnerId, learner.userId);
  await clearCookies();
  return { ok: true, jobId: r.jobId };
});
