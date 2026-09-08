import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { getActivityView, recordAssistance } from "@/server/services/learning";

export const dynamic = "force-dynamic";

/** POST /api/activities/:id/assistance: reveal a hint, the worked answer, or record explain-differently / go-deeper. */
export const POST = handler({ write: true }, async ({ identity, req, params }) => {
  const learner = requireLearner(identity);
  const body = await readJson(req, z.object({ kind: z.enum(["hint_1", "hint_2", "hint_3", "worked_answer", "explain_differently", "go_deeper"]) }));
  await recordAssistance(learner.learnerId, params.id, body.kind);
  const view = await getActivityView(learner.learnerId, params.id);
  return { assistance: view.assistance, hintsRevealed: view.hintsRevealed, workedAnswer: view.workedAnswer };
});
