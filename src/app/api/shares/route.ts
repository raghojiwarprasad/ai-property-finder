import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { eligibleChallenges, listShares, publishShare } from "@/server/services/sharing";

export const dynamic = "force-dynamic";

const Target = z.union([z.object({ kind: z.literal("challenge"), family: z.string() }), z.object({ kind: z.literal("work"), artefactId: z.string() })]);

/** POST /api/shares: publish an explicit sanitised snapshot. */
export const POST = handler({ write: true, rateLimit: { key: "shares", limit: 20, windowMs: 3600_000 } }, async ({ identity, req }) => {
  const body = await readJson(req, z.intersection(Target, z.object({ showName: z.boolean(), displayName: z.string().optional() })));
  return publishShare(requireLearner(identity).learnerId, body);
});

export const GET = handler({}, async ({ identity }) => {
  const learner = requireLearner(identity);
  return { shares: await listShares(learner.learnerId), eligibleChallenges: await eligibleChallenges(learner.learnerId) };
});
