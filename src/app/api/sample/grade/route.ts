import { z } from "zod";
import { handler, readJson } from "@/server/lib/api";
import { gradeSample } from "@/server/services/sample";
import { notFound } from "@/server/lib/errors";

export const dynamic = "force-dynamic";

/** Grades the labelled sample lesson's task without creating a profile or saving anything. */
export const POST = handler({ write: true, rateLimit: { key: "sample", limit: 60, windowMs: 600_000 } }, async ({ req }) => {
  const body = await readJson(req, z.object({ family: z.string(), submission: z.record(z.string(), z.unknown()) }));
  const r = gradeSample(body.family, body.submission);
  if (!r) throw notFound("Sample task not found.");
  return r;
});
