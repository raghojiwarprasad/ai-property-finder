import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { runPractice } from "@/server/services/practice";

export const dynamic = "force-dynamic";

/** POST /api/practice/runs: run a permitted simulation template with bounded inputs. */
export const POST = handler({ write: true, rateLimit: { key: "practice", limit: 60, windowMs: 600_000 } }, async ({ identity, req }) => {
  const body = await readJson(req, z.object({ practiceId: z.string(), scenarioKey: z.string(), configuration: z.record(z.string(), z.unknown()), assignmentId: z.string().nullable().optional() }));
  return runPractice(requireLearner(identity).learnerId, body);
});
