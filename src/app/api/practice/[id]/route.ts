import { handler, requireLearner } from "@/server/lib/api";
import { getPractice } from "@/content";
import { notFound } from "@/server/lib/errors";
import { listRuns, publicPractice } from "@/server/services/practice";

export const dynamic = "force-dynamic";

export const GET = handler({}, async ({ identity, params }) => {
  const p = getPractice(params.id);
  if (!p) throw notFound("Practice not found.");
  const runs = identity ? await listRuns(identity.learnerId, p.id) : [];
  return { practice: publicPractice(p), runs: runs.map((r) => ({ id: r.id, runNumber: r.runNumber, scenarioKey: r.scenarioKey, configuration: r.configuration, trace: r.trace, outcome: r.outcome, createdAt: r.createdAt })) };
});
