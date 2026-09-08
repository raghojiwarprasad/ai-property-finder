import { z } from "zod";
import { handler, readJson, requireLearner } from "@/server/lib/api";
import { updatePreferences } from "@/server/services/identity";

export const dynamic = "force-dynamic";

export const PATCH = handler({ write: true }, async ({ identity, req }) => {
  const learner = requireLearner(identity);
  const body = await readJson(req, z.object({ sessionMinutes: z.union([z.literal(10), z.literal(20), z.literal(40)]).optional(), personalExamples: z.boolean().optional(), exampleDomainOverride: z.string().nullable().optional(), reminders: z.boolean().optional() }));
  return { preferences: await updatePreferences(learner.learnerId, body) };
});
