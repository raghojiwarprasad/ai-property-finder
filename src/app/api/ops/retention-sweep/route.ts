import { handler } from "@/server/lib/api";
import { retentionSweep } from "@/server/services/privacy";
import { unauthenticated } from "@/server/lib/errors";

export const dynamic = "force-dynamic";

/** POST /api/ops/retention-sweep: operations route guarded by OPS_TOKEN; a scheduler calls it, or use `npm run retention:sweep`. */
export const POST = handler({ write: true }, async ({ req }) => {
  const token = process.env.OPS_TOKEN;
  if (!token || req.headers.get("x-ops-token") !== token) throw unauthenticated("Operations token required.");
  return retentionSweep();
});
